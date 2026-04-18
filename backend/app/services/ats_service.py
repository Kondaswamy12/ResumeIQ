import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ================= CONFIGURATION =================
class ScoringConfig:
    """
    Centralized scoring configuration.
    Values are empirically tuned for balanced ATS evaluation.
    """

    COMPONENT_WEIGHTS = {
        "skill_match": 0.45,
        "ats_keywords": 0.15,
        "section_completeness": 0.25,
        "formatting": 0.22,
    }

    ENSEMBLE_WEIGHTS = {
        "rule_based": 0.8,
        "ml_based": 0.2,
    }

    NORMALIZATION = {
        "scaling_factor": 1.15,
        "max_normalize_score": 92
    }


# ================= UTILITIES =================
def normalize_text(text: str):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s/.#+\-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def keyword_exists(normalized: str, keyword: str):
    pattern = rf"\b{re.escape(keyword.lower())}\b"
    return bool(re.search(pattern, normalized)) or keyword.lower() in normalized


# ================= SKILL MATCHING =================
def find_weighted_skills(text: str, skills: list):
    normalized = normalize_text(text)

    matched = []
    missing = []
    earned_weight = 0
    total_weight = 0

    for skill in skills:
        name = skill.get("name")
        weight = skill.get("weight", 1)

        total_weight += weight

        if keyword_exists(normalized, name):
            matched.append(name)
            earned_weight += weight
        else:
            missing.append(name)

    score = int((earned_weight / total_weight) * 100) if total_weight else 0

    return matched, missing, score


def evaluate_ats_keywords(text: str, ats_data: dict):
    normalized = normalize_text(text)

    matched = []
    earned_weight = 0
    total_weight = 0

    for category in ats_data.get("categories", []):
        cat_weight = category.get("weight", 1)

        for kw in category.get("keywords", []):
            keyword = kw.get("keyword")
            weight = kw.get("weight", 1)

            effective_weight = weight * cat_weight
            total_weight += effective_weight

            if keyword_exists(normalized, keyword):
                matched.append({
                    "keyword": keyword,
                    "weight": weight,
                    "category": category.get("category")
                })
                earned_weight += effective_weight

    score = int((earned_weight / total_weight) * 100) if total_weight else 0

    return score, matched


# ================= SECTION DETECTION =================
COMMON_SECTIONS = ["education", "skills", "experience", "projects"]

SECTION_PATTERNS = {
    "education": [r"\beducation\b", r"\bacademic\b", r"\bdegree\b"],
    "skills": [r"\bskills\b"],
    "experience": [r"\bexperience\b"],
    "projects": [r"\bprojects\b"],
}


def detect_sections(text: str):
    found = []
    missing = []

    for section in COMMON_SECTIONS:
        patterns = SECTION_PATTERNS.get(section, [rf"\b{section}\b"])

        if any(re.search(p, text, re.IGNORECASE) for p in patterns):
            found.append(section)
        else:
            missing.append(section)

    return found, missing


# ================= FORMATTING =================
def check_formatting(text: str):
    score = 100
    issues = []

    if not re.search(r"[\w.-]+@[\w.-]+\.\w+", text):
        issues.append("No email")
        score -= 15

    if not re.search(r"(\+?\d[\d\s\-().]{7,}\d)", text):
        issues.append("No phone")
        score -= 10

    if len(text) < 200:
        issues.append("Too short")
        score -= 20

    if not re.search(r"[•\-\*]", text):
        issues.append("No bullet points")
        score -= 10

    if not re.search(r"\b(20\d{2}|19\d{2})\b", text):
        issues.append("No dates")
        score -= 10

    return max(score, 0), issues


# ================= ML SIMILARITY =================
def calculate_ml_similarity(text: str, role_data: dict):
    """
    Computes semantic similarity using TF-IDF.
    Includes slight calibration bias for stability.
    """
    skills = role_data.get("skills", [])
    role_text = " ".join([skill.get("name", "") for skill in skills])

    documents = [text, role_text]

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(documents)

    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    # Calibration (unchanged logic)
    return int((similarity * 100) * 0.85 + 10)


# ================= SCORING PIPELINE =================
def compute_base_score(keyword_score, ats_keyword_score, section_score, formatting_score):
    """
    Aggregates deterministic scoring components.
    """
    w = ScoringConfig.COMPONENT_WEIGHTS

    return (
        keyword_score * w["skill_match"] +
        ats_keyword_score * w["ats_keywords"] +
        section_score * w["section_completeness"] +
        formatting_score * w["formatting"]
    )


def combine_with_ml(base_score, ml_score):
    """
    Hybrid ensemble of rule-based and ML scoring.
    """
    w = ScoringConfig.ENSEMBLE_WEIGHTS
    return (base_score * w["rule_based"]) + (ml_score * w["ml_based"])


def normalize_score(score):
    """
    Normalizes and bounds final score.
    """
    norm = ScoringConfig.NORMALIZATION
    scaled = score * norm["scaling_factor"]
    return min(int(scaled), norm["max_normalize_score"])


# ================= MAIN FUNCTION =================
def calculate_ats(full_text: str, role_data: dict, ats_data: dict):

    skills = role_data.get("skills", [])

    # Skill matching
    matched, missing, keyword_score = find_weighted_skills(full_text, skills)

    # ATS keywords
    ats_keyword_score, matched_ats_keywords = evaluate_ats_keywords(full_text, ats_data)

    # Sections
    found_sections, missing_sections = detect_sections(full_text)
    required_sections = role_data.get("sections", ["education", "skills", "experience"])

    found_required = [
        s for s in required_sections
        if s.lower() in [f.lower() for f in found_sections]
    ]

    section_score = int((len(found_required) / len(required_sections)) * 100)

    # Formatting
    formatting_score, issues = check_formatting(full_text)

    # ML score
    ml_score = calculate_ml_similarity(full_text, role_data)

    # ===== CLEAN PIPELINE =====
    base_score = compute_base_score(
        keyword_score,
        ats_keyword_score,
        section_score,
        formatting_score
    )

    combined_score = combine_with_ml(base_score, ml_score)
    final_score = normalize_score(combined_score)

    # ===== KEYWORD PROCESSING (unchanged) =====
    matched_keywords = matched + [kw["keyword"] for kw in matched_ats_keywords]

    soft_skills_keywords = [
        kw.get("keyword")
        for cat in ats_data.get("categories", [])
        if cat.get("category", "").lower() == "soft skills"
        for kw in cat.get("keywords", [])
    ]

    missing_keywords = list(set(soft_skills_keywords) - set(matched_keywords))

    matched_keywords = list(dict.fromkeys(matched_keywords))[:16]
    missing_keywords = list(dict.fromkeys(missing_keywords))[:4]

    return {
        "overallScore": final_score,
        "keywordScore": int((keyword_score * 0.7) + (ats_keyword_score * 0.3)),
        "sectionScore": section_score,
        "formattingScore": formatting_score,

        "matchedKeywords": matched_keywords,
        "missingKeywords": missing_keywords,

        "foundSections": found_sections,
        "missingSections": missing_sections,

        "formattingIssues": issues
    }
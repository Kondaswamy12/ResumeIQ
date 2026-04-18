import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ================= CONFIG =================
class RoleScoringConfig:
    """
    Configuration for role-based ML evaluation.
    Values are tuned for balanced scoring and interpretability.
    """

    SKILL_BOOST_FACTOR = 1.1
    SKILL_SCORE_CAP = 95

    SECTION_WEIGHTS = {
        "similarity": 0.6,
        "keyword": 0.4
    }

    SECTION_MULTIPLIERS = {
        "primary": 4,   # first 3 sections
        "secondary": 3  # others
    }

    SECTION_SCORE_CAP = 92

    FINAL_WEIGHTS = {
        "skill": 0.70,
        "section": 0.20
    }

    NORMALIZATION_FACTOR = 1.6
    MAX_NORMALIZED_SCORE = 92


# ================= NORMALIZATION =================
def normalize_text(text: str):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s/.#+\-]", " ", text.lower()))


# ================= UTILITIES =================
def get_skill_names(skills):
    return [
        skill["name"] if isinstance(skill, dict) else skill
        for skill in skills
    ]


# ================= RULE-BASED SKILL MATCH =================
def find_matched_skills(text: str, skills: list):
    normalized = normalize_text(text)
    skill_names = get_skill_names(skills)

    matched = []
    missing = []

    for skill in skill_names:
        skill_lower = skill.lower()
        pattern = rf"\b{re.escape(skill_lower)}\b"

        if re.search(pattern, normalized) or skill_lower in normalized:
            matched.append(skill)
        else:
            missing.append(skill)

    return matched, missing


# ================= SKILL SCORING =================
def calculate_skill_score(matched, total):
    """
    Computes skill match score with slight calibration boost.
    """
    if total == 0:
        return 0

    raw_score = (len(matched) / total) * 100

    boosted = raw_score * RoleScoringConfig.SKILL_BOOST_FACTOR

    return min(int(boosted), RoleScoringConfig.SKILL_SCORE_CAP)


# ================= ML SIMILARITY =================
def compute_similarity(text1: str, text2: str):
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([text1, text2])
    similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
    return similarity


# ================= SECTION SCORING =================
def calculate_section_scores(full_text, role):
    """
    Evaluates section relevance using hybrid similarity + keyword scoring.
    """
    scores = []
    normalized_text = normalize_text(full_text)

    role_skills = get_skill_names(role.get("skills", []))

    sections = [
        sec for sec in role.get("sections", ["skills", "experience"])
        if sec.lower() != "education"
    ]

    for index, sec in enumerate(sections):
        sec_lower = sec.lower()

        # -------- CONTEXT GENERATION --------
        if sec_lower == "skills":
            section_text = " ".join(role_skills)

        elif sec_lower == "experience":
            section_text = " ".join(role_skills) + " work experience internship project"

        elif sec_lower == "projects":
            section_text = " ".join(role_skills) + " project development built application"

        elif sec_lower == "certifications":
            section_text = "certification course training " + " ".join(role_skills)

        else:
            section_text = sec_lower

        # -------- ML SIMILARITY --------
        similarity = float(compute_similarity(full_text, section_text))

        # -------- KEYWORD MATCH --------
        match_count = 0
        for skill in role_skills:
            pattern = rf"\b{re.escape(skill.lower())}\b"
            if re.search(pattern, normalized_text):
                match_count += 1

        keyword_score = (
            match_count / len(role_skills)
            if role_skills else 0.0
        )

        # -------- COMBINED SCORE --------
        w = RoleScoringConfig.SECTION_WEIGHTS

        combined = (similarity * w["similarity"]) + (keyword_score * w["keyword"])
        combined = max(0.0, min(combined, 1.0))

        base_score = combined * 100

        # -------- IMPORTANCE MULTIPLIER --------
        multiplier = (
            RoleScoringConfig.SECTION_MULTIPLIERS["primary"]
            if index < 3
            else RoleScoringConfig.SECTION_MULTIPLIERS["secondary"]
        )

        boosted_score = base_score * multiplier

        final_score = int(min(boosted_score, RoleScoringConfig.SECTION_SCORE_CAP))

        found = combined > 0.25

        scores.append({
            "name": sec,
            "score": final_score,
            "found": found
        })

    return scores


# ================= MAIN FUNCTION =================
def evaluate_role_ml(full_text: str, roles_data: list, target_role: str):
    """
    Role-specific resume evaluation using hybrid scoring.
    """

    # -------- ROLE RESOLUTION --------
    role = next((r for r in roles_data if r["role"] == target_role), None)

    if not role:
        raise ValueError("Role not found")

    skills = role.get("skills", [])
    sections = role.get("sections", ["skills", "experience"])

    # -------- SKILL MATCH --------
    matched, missing = find_matched_skills(full_text, skills)

    skill_score = calculate_skill_score(matched, len(get_skill_names(skills)))

    # -------- SECTION SCORING --------
    section_scores = calculate_section_scores(full_text, role)

    avg_section_score = (
        sum(s["score"] for s in section_scores) / len(section_scores)
        if section_scores else 0
    )

    # -------- FINAL AGGREGATION --------
    w = RoleScoringConfig.FINAL_WEIGHTS

    final_score = int(
        skill_score * w["skill"] +
        avg_section_score * w["section"]
    )

    # -------- NORMALIZATION --------
    final_score = min(
        int(final_score * RoleScoringConfig.NORMALIZATION_FACTOR),
        RoleScoringConfig.MAX_NORMALIZED_SCORE
    )

    return {
        "role": target_role,
        "overall_score": final_score,
        "skill_score": skill_score,
        "section_avg_score": int(avg_section_score),
        "section_scores": section_scores,
        "matched_skills": matched,
        "missing_skills": missing
    }
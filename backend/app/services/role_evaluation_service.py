import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ---------- NORMALIZATION ----------
def normalize_text(text: str):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s/.#+\-]", " ", text.lower()))


# ---------- EXTRACT SKILL NAMES ----------
def get_skill_names(skills):
    return [
        skill["name"] if isinstance(skill, dict) else skill
        for skill in skills
    ]


# ---------- RULE-BASED SKILL MATCH ----------
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


# ---------- SKILL SCORE ----------
def calculate_skill_score(matched, total):
    if total == 0:
        return 0

    raw_score = (len(matched) / total) * 100

    # slight boost
    boosted = raw_score * 1.1

    return min(int(boosted), 95)


def compute_similarity(text1: str, text2: str):
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([text1, text2])
    similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
    return similarity


def calculate_section_scores(full_text, role):
    scores = []
    normalized_text = normalize_text(full_text)

    role_skills = get_skill_names(role.get("skills", []))

    sections = [
        sec for sec in role.get("sections", ["skills", "experience"])
        if sec.lower() != "education"
    ]

    for index, sec in enumerate(sections):
        sec_lower = sec.lower()

        #  ROLE-SPECIFIC CONTEXT
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

        #  ML similarity
        similarity = float(compute_similarity(full_text, section_text))

        #  keyword match
        match_count = 0
        for skill in role_skills:
            pattern = rf"\b{re.escape(skill.lower())}\b"
            if re.search(pattern, normalized_text):
                match_count += 1

        keyword_score = (
            match_count / len(role_skills)
            if role_skills else 0.0
        )

        #  base score
        combined = (similarity * 0.6) + (keyword_score * 0.4)
        combined = max(0.0, min(combined, 1.0))

        base_score = combined * 100

        if index < 3:
            boosted_score = base_score * 4
        else:
            boosted_score = base_score * 3

        final_score = int(min(boosted_score, 92))

        found = combined > 0.25

        scores.append({
            "name": sec,
            "score": final_score,
            "found": found
        })

    return scores


# ---------- MAIN FUNCTION ----------
def evaluate_role_ml(full_text: str, roles_data: list, target_role: str):

    # 🔹 Find role
    role = next((r for r in roles_data if r["role"] == target_role), None)

    if not role:
        raise ValueError("Role not found")

    normalized_val = 1.75

    skills = role.get("skills", [])
    sections = role.get("sections", ["skills", "experience"])

    # 🔹 Skill matching
    matched, missing = find_matched_skills(full_text, skills)

    skill_score = calculate_skill_score(matched, len(get_skill_names(skills)))

    #  FIXED: role-based section scoring
    section_scores = calculate_section_scores(full_text, role)

    avg_section_score = (
        sum(s["score"] for s in section_scores) / len(section_scores)
        if section_scores else 0
    )

    #  final score
    final_score = int(skill_score * 0.75 + avg_section_score * 0.2)

    final_score = min(int(final_score * normalized_val), 92)

    return {
        "role": target_role,
        "overall_score": final_score,
        "skill_score": skill_score,
        "section_avg_score": int(avg_section_score),
        "section_scores": section_scores,
        "matched_skills": matched,
        "missing_skills": missing
    }
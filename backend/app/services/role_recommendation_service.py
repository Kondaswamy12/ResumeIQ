from app.services.role_evaluation_service import evaluate_role_ml


def get_top_roles(full_text: str, roles_data: list, top_n: int = 5):

    results = []

    for role in roles_data:
        role_name = role.get("role")

        try:
            evaluation = evaluate_role_ml(full_text, roles_data, role_name)

            results.append({
                "role": role_name,
                "overall_score": evaluation["overall_score"],
                "matched_skills": evaluation["matched_skills"],
                "missing_skills": evaluation["missing_skills"]
            })

        except Exception:
            continue  # skip if any issue

    #  Sort by score descending
    results.sort(key=lambda x: x["overall_score"], reverse=True)

    #  Return top N
    return results[:top_n]
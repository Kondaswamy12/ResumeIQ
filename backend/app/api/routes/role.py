from fastapi import APIRouter, HTTPException
from app.services.role_recommendation_service import get_top_roles
from app.core.storage import resume_store

router = APIRouter()


@router.get("/recommend-roles/{resume_id}")
def recommend_roles(resume_id: str):

    # ✅ Check if resume exists for this ID
    if resume_id not in resume_store:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_data = resume_store[resume_id]

    full_text = resume_data.get("full_text")
    roles_data = resume_data.get("roles_data")

    if not full_text or not roles_data:
        raise HTTPException(status_code=400, detail="Incomplete resume data")

    # ✅ Get top roles
    top_roles = get_top_roles(full_text, roles_data, 5)

    return {
        "resume_id": resume_id,
        "recommended_roles": top_roles
    }
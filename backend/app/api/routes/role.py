from fastapi import APIRouter, HTTPException
from app.services.role_recommendation_service import get_top_roles
from app.core.storage import resume_store

router = APIRouter()


@router.get("/recommend-roles")
def recommend_roles():

    # Check if resume exists in temporary storage
    if not resume_store:
        raise HTTPException(status_code=404, detail="No resume uploaded")

    full_text = resume_store.get("full_text")
    roles_data = resume_store.get("roles_data")

    if not full_text or not roles_data:
        raise HTTPException(status_code=400, detail="Incomplete resume data")

    # Get top roles
    top_roles = get_top_roles(full_text, roles_data, 5)

    return {
        "recommended_roles": top_roles
    }
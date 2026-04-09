from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.storage import resume_store
from app.services.role_evaluation_service import evaluate_role_ml

router = APIRouter()


# Request body
class RoleRequest(BaseModel):
    role: str


@router.post("/evaluate-role")
def evaluate_role(request: RoleRequest):

    # Check if resume exists
    if not resume_store:
        raise HTTPException(status_code=404, detail="No resume uploaded")

    full_text = resume_store.get("full_text")
    roles_data = resume_store.get("roles_data")

    if not full_text or not roles_data:
        raise HTTPException(status_code=400, detail="Incomplete resume data")

    role = request.role

    # Evaluate selected role
    result = evaluate_role_ml(full_text, roles_data, role)

    return {
        "role": role,
        "evaluation": result
    }
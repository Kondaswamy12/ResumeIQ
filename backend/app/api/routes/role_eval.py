from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.storage import resume_store
from app.services.role_evaluation_service import evaluate_role_ml

router = APIRouter()


# Request body
class RoleRequest(BaseModel):
    role: str


@router.post("/evaluate-role/{resume_id}")
def evaluate_role(resume_id: str, request: RoleRequest):

    if resume_id not in resume_store:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_data = resume_store[resume_id]

    full_text = resume_data.get("full_text")
    roles_data = resume_data.get("roles_data")

    if not full_text or not roles_data:
        raise HTTPException(status_code=400, detail="Incomplete resume data")

    role = request.role

    result = evaluate_role_ml(full_text, roles_data, role)

    return {
        "resume_id": resume_id,
        "role": role,
        "evaluation": result
    }
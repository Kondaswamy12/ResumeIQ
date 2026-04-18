from fastapi import APIRouter, HTTPException
from app.core.storage import resume_store

router = APIRouter()

@router.post("/resume/{resume_id}")
def delete_resume(resume_id: str):
    if resume_id in resume_store:
        del resume_store[resume_id]
    return {"message": "deleted"}
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.parser_service import extract_text
from app.core.database import roles_collection, ats_collection
from app.core.storage import resume_store
from app.services.ats_service import calculate_ats
from app.services.grammar_service import analyze_text_quality

router = APIRouter()

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    if not (file.filename.endswith(".pdf") or file.filename.endswith(".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX allowed")

    text = extract_text(file)

    if text is None:
        raise HTTPException(status_code=400, detail="Error processing file")

    full_text = " ".join(text.split("\n"))

    roles_data = list(roles_collection.find({}, {"_id": 0}))
    atss_data = list(ats_collection.find({}, {"_id": 0}))

    role_data = roles_data[0] if roles_data else {}
    ats_data = atss_data[0] if atss_data else {}

    ats_result = calculate_ats(full_text, role_data, ats_data)
    quality_result = analyze_text_quality(full_text)

    role_names = [role.get("role", "") for role in roles_data]

    #  Store ONLY ONE resume (overwrite previous)
    resume_store.clear()
    resume_store.update({
        "filename": file.filename,
        "full_text": full_text,
        "roles_data": roles_data
    })

    return {
        "message": "Resume processed",
        "filename": file.filename,
        "full_text": full_text,
        "available_roles": role_names,
        "grammar_issues": quality_result,
        "ats_score": ats_result
    }
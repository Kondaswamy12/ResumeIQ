from fastapi import FastAPI
from app.api.routes import resume
from app.api.routes import role   
from app.api.routes import role_eval
from app.api.routes import delete
from fastapi.middleware.cors import CORSMiddleware




app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all frontend URLs
    allow_credentials=True,
    allow_methods=["*"],   # allow all methods (GET, POST, etc.)
    allow_headers=["*"],   # allow all headers
)

app.include_router(resume.router, prefix="/api")
app.include_router(role.router, prefix="/api")   
app.include_router(role_eval.router, prefix="/api")
app.include_router(delete.router, prefix="/api")

@app.get("/")
def home():
    return {"message": "ResumeIQ backend running "}
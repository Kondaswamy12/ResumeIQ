import pdfplumber
from docx import Document

def extract_text_from_pdf(file):
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text


def extract_text_from_docx(file):
    doc = Document(file)
    return "\n".join([para.text for para in doc.paragraphs])


def extract_text(file):
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        return extract_text_from_pdf(file.file)

    elif filename.endswith(".docx"):
        return extract_text_from_docx(file.file)

    else:
        return None
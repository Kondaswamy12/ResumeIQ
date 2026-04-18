import pdfplumber
from docx import Document

SEPARATOR = "  $n$  "

def extract_text_from_pdf(file):
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                lines = page_text.split("\n")
                for line in lines:
                    text += line.strip() + SEPARATOR  # ✅ custom separator
    return text


def extract_text_from_docx(file):
    doc = Document(file)
    text = ""
    for para in doc.paragraphs:
        text += para.text.strip() + SEPARATOR  # ✅ custom separator
    return text


def extract_text(file):
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        return extract_text_from_pdf(file.file)

    elif filename.endswith(".docx"):
        return extract_text_from_docx(file.file)

    else:
        return None
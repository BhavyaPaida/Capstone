import pdfplumber
import re
from collections import defaultdict
def extract_text_from_pdf(file_path):
    text=""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text+=page.extract_text()+"\n"
    lines=[line.strip() for line in text.split('\n') if line.strip()]


    section_patterns = {
        "education": r"^(education|academic\s*background)$",
        "skills": r"^(skills|technical\s*skills|coursework\s*/\s*skills)$",
        "projects": r"^(projects|academic\s*projects|personal\s*projects)$",
        "experience": r"^(experience|work\s*experience|professional\s*experience|internship|employment)$",
        "certifications": r"^(certifications|certificates|achievements)$",
        "extracurricular": r"^(extracurricular|activities|leadership)$",
    }

    headers = []
    for i, line in enumerate(lines):
        clean_line = line.strip().lower()
        for section, pattern in section_patterns.items():
            if re.match(pattern, clean_line):
                headers.append((i, section))

    headers.sort(key=lambda x: x[0])
    parsed = defaultdict(list)

    # Split into sections
    for idx, (start_idx, section) in enumerate(headers):
        end_idx = headers[idx + 1][0] if idx + 1 < len(headers) else len(lines)
        parsed[section].extend(lines[start_idx + 1:end_idx])
import pdfplumber
import re
from collections import defaultdict
def extract_text_from_pdf(file_path):
    text=""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text+=page.extract_text()+"\n"
    lines=[line.strip() for line in text.split('\n') if line.strip()]

    cleaned_lines=[]
    prev_line=None
    for line in lines:
        if line!=prev_line:
            cleaned_lines.append(line)
            prev_line=line
    lines=cleaned_lines

    section_patterns = {
        "education": r"^(education|academic\s*background)$",
        "skills": r"^(skills|technical\s*skills|coursework\s*/\s*skills)$",
        "projects": r"^(projects|academic\s*projects|personal\s*projects)$",
        "experience": r"^(experience|work\s*experience|professional\s*experience|internship|employment)$",
        "certifications": r"^(certifications|certificates|achievements|awards|awards\s*certifications)$",
        "extracurricular": r"^(extracurricular|activities|leadership|extracurricular\s*activities)$",
    }

    headers = []
    for i, line in enumerate(lines):
        clean_line = line.strip().lower()
        for section, pattern in section_patterns.items():
            if re.match(pattern, clean_line):
                headers.append((i, section))
    if not headers:
        print(" warning: no section headers found!")
        return {}
    
    headers.sort(key=lambda x: x[0])
    parsed = defaultdict(list)

    # Split into sections
    for idx, (start_idx, section) in enumerate(headers):
        end_idx = headers[idx + 1][0] if idx + 1 < len(headers) else len(lines)
        parsed[section].extend(lines[start_idx + 1:end_idx])
        """
    cleaned = defaultdict(list)

    for section, lines in parsed.items():
        for line in lines:
            l = line.lower().strip()

            # Detect new section header inside text (like "Extracurricular Activities" inside Certifications)
            for new_section, pattern in section_patterns.items():
                if re.match(pattern, l):
                    section = new_section  # dynamically switch section
                    break

            # Move project-like lines out of experience
            if section == "experience" and any(
                kw in l for kw in ["project", "developed", "dashboard", "built", "created"]
            ):
                cleaned["projects"].append(line)

            # Move certification-like lines
            elif section == "skills" and any(
                kw in l for kw in ["certified", "certificate", "certification"]
            ):
                cleaned["certifications"].append(line)

            else:
                cleaned[section].append(line)"""

    #return text,dict(cleaned)
    return parsed



if __name__ == "__main__":
    resume_sections=extract_text_from_pdf(r"backend\richita_resume.pdf")
    print(resume_sections)

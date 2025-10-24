from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np 
import pdfplumber
import re

def extract_text_from_pdf(file_path):
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    cleaned_lines = []
    prev_line = None
    for line in lines:
        if line != prev_line:
            cleaned_lines.append(line)
            prev_line = line
    return cleaned_lines

model = SentenceTransformer('all-MiniLM-L6-v2')

# Define very specific patterns with keywords
section_keywords = {
    "Company Info": [
        "why join", "why we exist", "our purpose", "transformation", 
        "about us", "company overview", "our mission", "our vision",
        "leadership principles", "guided by", "caterpillar", "who we are",
        "our team", "our commitment", "world's leading", "for nearly",
        "our employees", "making sustainable", "customers turn to",
        "manufacturer of", "competitive edge", "lasting legacy"
    ],
    
    "Role": [
        "job title", "position summary", "role overview", "about the role",
        "internship details", "intern:", "position:", "role:", "engineering internship",
        "corporate intern", "job description", "opportunity"
    ],
    
    "Responsibilities": [
        "responsibilities", "duties", "what you'll do", "you will",
        "day-to-day", "expected to", "perform", "evaluate", "contribute",
        "support other", "assist in", "key role", "job assignments",
        "responsibilities include", "initiate ideas", "needs analysis"
    ],
    
    "Education": [
        "education", "degree", "bachelor", "master", "graduate",
        "qualification", "completed", "specialization", "third year",
        "accredited"
    ],
    
    "Experience": [
        "years of experience", "experience required", "work experience",
        "practical experience", "exposure to"
    ],
    
    "Technical Skills": [
        "technical skills", "programming", "languages such as", 
        "technologies such as", "sql", "python", "java", "hadoop",
        "cloud platforms", "aws", "azure", "familiarity with",
        "proficiency in", "knowledge of", "understanding of",
        "tools such as", "matlab", "creo", "technical aptitude",
        "generators", "controllers", "coding", "automation",
        "gensets", "renewables", "smart grid", "pid controllers",
        "battery management", "excel with macros", "process automation"
    ],
    
    "Soft Skills": [
        "communication", "analytical", "problem-solving", "interpersonal",
        "organizational skills", "presentation", "troubleshooting",
        "self-starter", "independently", "written and verbal",
        "ability to communicate", "confidence to work", "minimum hand hold"
    ],
    
    "Requirements": [
        "minimum requirements", "qualifications - external", "requirements",
        "must have", "ability to", "credits", "grades", "aptitude",
        "minimum qualifications", "eligibility"
    ],
    
    "Benefits": [
        "benefits", "perks", "privileges", "perquisites", "work-life balance",
        "medical coverage", "transportation", "cafeteria", "relocation",
        "certification", "training program", "wheels and meals",
        "employee assistance", "what we offer", "compensation"
    ],
    
    "Equal Opportunity": [
        "equal opportunity", "diversity", "inclusion", "workplace culture",
        "de+i", "equity"
    ]
}

def calculate_section_scores(text_chunk, section_keywords):
    """Calculate keyword-based scores for each section"""
    text_lower = text_chunk.lower()
    scores = {}
    
    for section, keywords in section_keywords.items():
        score = 0
        for keyword in keywords:
            if keyword.lower() in text_lower:
                score += 1
        scores[section] = score
    
    return scores

def is_section_header(line, next_line=None):
    """Detect if a line is a section header"""
    line = line.strip()
    
    if not line:
        return False
    
    # Ends with colon - STRONG indicator (even if long)
    if line.endswith(':'):
        # But not if it's part of a sentence (e.g., "such as:")
        if not line.lower().endswith(('such as:', 'like:', 'including:')):
            return True
    
    # Question mark (like "Why Join...?")
    if line.endswith('?') and len(line.split()) <= 10:
        return True
    
    # Short, title/upper case
    word_count = len(line.split())
    if word_count <= 8:  # Increased from 6 to 8
        if line.isupper() or line.istitle():
            return True
    
    # Followed by bullet points (strong indicator even if line is longer)
    if next_line and next_line.strip().startswith(('•', '-', '*', '○')):
        # If next line is bullet and current line is title-case or has colon
        if line.istitle() or ':' in line:
            return True
    
    return False

def is_bullet_or_numbered(line):
    """Check if line is a bullet or numbered list item"""
    line = line.strip()
    if line.startswith(('•', '-', '*', '○')):
        return True
    if re.match(r'^\d+[\.\)]\s', line):
        return True
    return False

def classify_by_keywords(text, section_keywords):
    """Classify text using keyword matching"""
    scores = calculate_section_scores(text, section_keywords)
    if max(scores.values()) > 0:
        return max(scores.items(), key=lambda x: x[1])[0]
    return None

def group_jd_sections_hybrid(lines):
    """Hybrid approach: structure + keywords + context"""
    sections = {}
    current_section = "Miscellaneous"
    sections[current_section] = []
    
    buffer = []  # Buffer to accumulate lines before deciding section
    
    for i, line in enumerate(lines):
        next_line = lines[i+1] if i + 1 < len(lines) else None
        
        # Detect headers
        if is_section_header(line, next_line):
            # Before switching, classify accumulated buffer
            if buffer:
                buffer_text = ' '.join(buffer)
                keyword_section = classify_by_keywords(buffer_text, section_keywords)
                
                if keyword_section and current_section == "Miscellaneous":
                    current_section = keyword_section
                    if current_section not in sections:
                        sections[current_section] = []
                
                sections[current_section].extend(buffer)
                buffer = []
            
            # Classify the header itself
            header_section = classify_by_keywords(line, section_keywords)
            
            if header_section:
                current_section = header_section
            else:
                # Check with semantic embedding as fallback
                line_emb = model.encode([line])[0]
                
                # Create embeddings for section names
                section_name_embs = {}
                for section in section_keywords.keys():
                    section_name_embs[section] = model.encode([section])[0]
                
                sims = {section: cosine_similarity([line_emb], [emb])[0][0] 
                        for section, emb in section_name_embs.items()}
                best_section, best_score = max(sims.items(), key=lambda x: x[1])
                
                if best_score > 0.5:
                    current_section = best_section
                else:
                    current_section = "Miscellaneous"
            
            if current_section not in sections:
                sections[current_section] = []
            
            sections[current_section].append(line)
        
        else:
            # Not a header - add to buffer
            buffer.append(line)
            
            # If buffer gets too large, flush it
            if len(buffer) >= 5:
                buffer_text = ' '.join(buffer)
                keyword_section = classify_by_keywords(buffer_text, section_keywords)
                
                if keyword_section and keyword_section != current_section:
                    current_section = keyword_section
                    if current_section not in sections:
                        sections[current_section] = []
                
                sections[current_section].extend(buffer)
                buffer = []
    
    # Flush remaining buffer
    if buffer:
        buffer_text = ' '.join(buffer)
        keyword_section = classify_by_keywords(buffer_text, section_keywords)
        
        if keyword_section:
            current_section = keyword_section
            if current_section not in sections:
                sections[current_section] = []
        
        sections[current_section].extend(buffer)
    
    return sections

def rescan_miscellaneous(sections, section_keywords):
    """Rescan Miscellaneous section to rescue missed content"""
    
    if "Miscellaneous" not in sections or not sections["Miscellaneous"]:
        return sections
    
    misc_lines = sections["Miscellaneous"]
    rescued_lines = {section: [] for section in sections.keys() if section != "Miscellaneous"}
    remaining_misc = []
    
    i = 0
    while i < len(misc_lines):
        line = misc_lines[i]
        next_line = misc_lines[i+1] if i + 1 < len(misc_lines) else None
        
        # Check if this line could be a missed header
        if is_section_header(line, next_line):
            # Classify the header
            header_section = classify_by_keywords(line, section_keywords)
            
            if header_section:
                # Found a header! Collect all following bullets/content
                rescued_lines[header_section].append(line)
                i += 1
                
                # Collect all following bullets and content until next header
                while i < len(misc_lines):
                    current = misc_lines[i]
                    next_in_loop = misc_lines[i+1] if i + 1 < len(misc_lines) else None
                    
                    # Stop if we hit another header
                    if is_section_header(current, next_in_loop):
                        break
                    
                    # Add bullet points and regular content
                    rescued_lines[header_section].append(current)
                    i += 1
            else:
                remaining_misc.append(line)
                i += 1
        else:
            # Try to classify this line by keywords
            line_section = classify_by_keywords(line, section_keywords)
            
            if line_section and is_bullet_or_numbered(line):
                # Bullet with keyword match - rescue it
                rescued_lines[line_section].append(line)
                i += 1
            else:
                # Group with next 2 lines for context
                group = [line]
                j = 1
                while j <= 2 and i + j < len(misc_lines):
                    group.append(misc_lines[i + j])
                    j += 1
                
                group_text = ' '.join(group)
                scores = calculate_section_scores(group_text, section_keywords)
                
                # If strong match, rescue the whole group
                if max(scores.values()) >= 2:
                    best_section = max(scores.items(), key=lambda x: x[1])[0]
                    rescued_lines[best_section].extend(group)
                    i += len(group)
                else:
                    remaining_misc.append(line)
                    i += 1
    
    # Merge rescued lines back into sections
    for section, lines in rescued_lines.items():
        if lines and section in sections:
            sections[section].extend(lines)
    
    # Update miscellaneous with only truly unclassified content
    sections["Miscellaneous"] = remaining_misc
    
    return sections

def post_process_sections(sections):
    """Merge and clean sections"""
    
    # Merge rules
    final_sections = {
        "Company Info": [],
        "Role": [],
        "Responsibilities": [],
        "Requirements": [],  # Education + Experience
        "Technical Skills": [],
        "Soft Skills": [],
        "Benefits": [],
        "Miscellaneous": []
    }
    
    for section, lines in sections.items():
        if not lines:
            continue
        
        # Merge education and experience into requirements
        if section in ["Education", "Experience"]:
            final_sections["Requirements"].extend(lines)
        # Merge equal opportunity into company info
        elif section == "Equal Opportunity":
            final_sections["Company Info"].extend(lines)
        # Keep others as is
        elif section in final_sections:
            final_sections[section].extend(lines)
        else:
            final_sections["Miscellaneous"].extend(lines)
    
    # RESCAN MISCELLANEOUS to rescue missed content
    final_sections = rescan_miscellaneous(final_sections, section_keywords)
    
    # Remove empty sections
    return {k: v for k, v in final_sections.items() if v}


def process_job_description(file_path):
    """Full pipeline: extract, group, and post-process JD sections"""
    lines = extract_text_from_pdf(file_path)
    jd_sections = group_jd_sections_hybrid(lines)
    jd_sections = post_process_sections(jd_sections)
    return jd_sections


# Main execution
if __name__ == "__main__":
    jd_sections=process_job_description(r"backend\7-Eleven_Associate Software Engineer_JD (1).pdf")
    # Print output
    """for section, content in jd_sections.items():
        print(f"\n{'='*70}")
        print(f"{section}")
        print('='*70)
        for line in content:
            print(line)"""
    print(jd_sections)
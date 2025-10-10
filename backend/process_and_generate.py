import sys
import json
import os
import requests
from dotenv import load_dotenv
from parser import extract_text_from_pdf, extract_text_from_jd

# Load environment variables
load_dotenv("key.env")

# Your Grok API key
GROK_API_KEY = os.getenv("GROK_API_KEY")
# Grok API URL (update to actual endpoint)
GROK_API_URL = "https://api.x.ai/v1/chat/completions"

def call_grok_api(prompt):
    headers = {
        "Authorization": f"Bearer {GROK_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "grok-4o",  # or your Grok model name
        "messages": [
            {"role": "system", "content": "You are an expert HR interviewer. Generate clear, specific interview questions."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 800
    }
    response = requests.post(GROK_API_URL, headers=headers, json=data)
    response.raise_for_status()
    return response.json()

def generate_interview_questions(resume_text, jd_text):
    prompt = f"""
    Based on the candidate's resume and the job description below,
    generate 10 personalized, relevant interview questions.
    
    Resume:
    {resume_text}

    Job Description:
    {jd_text}
    
    Return ONLY a numbered list of questions, one per line.
    """

    try:
        grok_response = call_grok_api(prompt)
        # Extract content from Grok response JSON structure (adjust if API differs)
        questions_text = grok_response['choices'][0]['message']['content'].strip()

        questions = []
        for line in questions_text.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                cleaned = line.lstrip('0123456789.-•) ').strip()
                if cleaned:
                    questions.append(cleaned)

        return questions
    except Exception as e:
        raise Exception(f"Grok API error: {str(e)}")


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        
        resume_path = input_data.get("resume_path")
        jd_path = input_data.get("jd_path")
        jd_text = input_data.get("jd_text", "")
        
        if not resume_path or not os.path.exists(resume_path):
            raise ValueError("Resume file not found")
        
        resume_text, _ = extract_text_from_pdf(resume_path)
        
        if jd_path and os.path.exists(jd_path):
            jd_lines = extract_text_from_jd(file_path=jd_path)
            jd_text = "\n".join(jd_lines)
        elif jd_text:
            jd_lines = extract_text_from_jd(pasted_text=jd_text)
            jd_text = "\n".join(jd_lines)
        else:
            raise ValueError("Job description not provided")
        
        questions = generate_interview_questions(resume_text, jd_text)
        
        result = {
            "success": True,
            "questions": questions,
            "count": len(questions)
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()

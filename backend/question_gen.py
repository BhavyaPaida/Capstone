# backend/questions_gen.py
import sys
import json
import openai

# Use your environment key (key.env) or os.environ
from dotenv import load_dotenv
import os
load_dotenv("key.env")

openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_interview_questions(resume_text, jd_text):
    prompt = f"""
    Based on the candidate's resume and the job description below,
    generate 10 personalized, relevant interview questions.
    Resume:
    {resume_text}

    Job Description:
    {jd_text}
    """

    response = openai.ChatCompletion.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are an expert HR interviewer."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=500
    )

    questions = response.choices[0].message.content.strip()
    return questions


if __name__ == "__main__":
    # This allows Node.js to call this file and get results
    input_data = json.loads(sys.stdin.read())
    resume_text = input_data.get("resume_text", "")
    jd_text = input_data.get("jd_text", "")
    result = generate_interview_questions(resume_text, jd_text)
    print(json.dumps({"questions": result}))

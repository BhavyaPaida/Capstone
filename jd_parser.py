import pdfplumber
import re
from collections import defaultdict

def extract_text_from_jd(file_path=None, pasted_text=None):
    if file_path:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
    elif pasted_text:
        text = pasted_text
    else:
        raise ValueError("Please provide either a PDF file path or pasted text.")

    # clean special chars
    text = text.replace('\xa0', ' ').replace('–', '-')
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    cleaned_lines = []
    prev_line = None
    for line in lines:
        if line != prev_line:
            cleaned_lines.append(line)
            prev_line = line
    lines = cleaned_lines


if __name__ == "__main__":
    text = extract_text_from_jd(file_path="7-Eleven_Associate Software Engineer_JD.pdf")
    print(text)

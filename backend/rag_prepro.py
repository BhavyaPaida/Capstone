import pdfplumber
import re
import json

def extract_structured_json_from_pdf(pdf_path, output_path="company_data.json"):
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    # 🧹 Step 1: Clean up newlines inside JSON
    # Remove random newlines, multiple spaces, and PDF artifacts
    cleaned_text = re.sub(r'\n+', ' ', text)
    cleaned_text = re.sub(r'\s{2,}', ' ', cleaned_text)
    cleaned_text = cleaned_text.replace("“", '"').replace("”", '"')

    # 🧠 Step 2: Find JSON-like structure
    json_match = re.search(r'(\[.*\])', cleaned_text)
    if not json_match:
        print("⚠️ Could not find JSON-like structure in PDF text.")
        return None

    json_text = json_match.group(1)

    # 🧩 Step 3: Try to parse JSON
    try:
        data = json.loads(json_text)
        print(f"✅ Successfully parsed structured JSON! Found {len(data)} segments.")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"💾 Saved cleaned data to {output_path}")
        return data
    except json.JSONDecodeError as e:
        print("❌ JSON parsing failed:", e)
        print(json_text[:1000])  # show start for debugging
        return None


pdf_path = "company_specific_interviews (2).pdf"
data = extract_structured_json_from_pdf(r"backend\company_data\company_specific_interviews (2).pdf")

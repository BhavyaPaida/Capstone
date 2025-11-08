import json

def load_company_data():
    with open("company_data.json", "r", encoding="utf-8") as f:
        return json.load(f)

def get_company_info(company_name: str):
    """Fetch company-specific interview style data."""
    data = load_company_data()
    for segment in data:
        for company in segment.get("companies", []):
            if company["name"].lower() == company_name.lower():
                return company
    return None


# Example usage
if __name__ == "__main__":
    company = "Amazon"
    info = get_company_info(company)

    if info:
        print(f"🎯 Company: {info['name']}")
        print(f"Interview Style: {info['interview_style']}")
        print(f"Focus Areas: {info['focus_areas']}")
        print(f"Tone: {info['question_tone']}")
        print(f"Keywords: {', '.join(info['keywords'])}")
    else:
        print("Company not found.")

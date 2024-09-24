import re
import json
import os

def load_existing_summaries():
    if os.path.exists("summaries.json"):
        with open("summaries.json", "r") as f:
            return json.load(f)
    return []

def save_summaries(summaries):
    with open("summaries.json", "w") as f:
        json.dump(summaries, f, indent=4)

def load_email_credentials():
    with open("email_credentials.json") as f:
        return json.load(f)["emails"]

def email_exists(summaries, email_id):
    return any(summary["email_id"] == email_id for summary in summaries)

def remove_blank_lines(text):
    return "\n".join([line for line in text.splitlines() if line.strip()])

def clean_text(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text
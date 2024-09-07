import requests
import json
from utils import clean_text

def summarize_with_llm(subject, body):
    url = "http://localhost:1234/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    
    clean_subject = clean_text(subject)
    clean_body = clean_text(body)
    
    payload = {
        "model": "lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf",
        "messages": [
            {"role": "system", "content": "Summarize as one sentence quick summary including contents and who sent it."},
            {"role": "user", "content": f"Subject: {clean_subject}\n\nBody: {clean_body}"}
        ],
        "temperature": 0.7,
        "max_tokens": -1
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response_data = response.json()

        if 'choices' in response_data and len(response_data['choices']) > 0:
            summary = response_data['choices'][0]['message']['content']
        else:
            summary = "Could not generate a summary."
    except requests.exceptions.RequestException as e:
        print(f"Error in API request: {e}")
        summary = "Could not generate a summary due to an API request error."
    
    return summary
import requests
import json
from utils import clean_text

# Now accepts both message and role as arguments
def rewrite_with_llm(message, role):
    url = "http://localhost:1234/v1/chat/completions"
    headers = {"Content-Type": "application/json"}

    clean_message = clean_text(message)

    # Use the provided role in the system message
    payload = {
        "model": "lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf",
        "messages": [
            {"role": "system", "content": role},  # Use the passed system role
            {"role": "user", "content": f"Message: {clean_message}"}
        ],
        "temperature": 0.7,
        "max_tokens": -1
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response_data = response.json()

        if 'choices' in response_data and len(response_data['choices']) > 0:
            rewritten_message = response_data['choices'][0]['message']['content']
        else:
            rewritten_message = "Could not rewrite the message."
    except requests.exceptions.RequestException as e:
        print(f"Error in API request: {e}")
        rewritten_message = "Could not rewrite the message due to an API request error."
    
    return rewritten_message
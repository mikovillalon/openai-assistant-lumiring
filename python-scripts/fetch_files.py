from dotenv import load_dotenv
import os
import json
import requests

# Explicitly specify the path to the .env file
load_dotenv(dotenv_path="../nodejs-app/.env")

API_KEY = os.getenv("OPENAI_API_KEY")  # Load the API key
VECTOR_STORE_ID = "vs_YP0hD5jHTowvBMWAST2mSBZW"

def fetch_files():
    try:
        response = requests.get(
            f"https://api.openai.com/v1/vector_stores/{VECTOR_STORE_ID}/files",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
                "OpenAI-Beta": "assistants=v2",
            },
        )
        if response.status_code == 200:
            files = response.json()["data"]
            result = {
                "success": True,
                "data": [
                    {
                        "file_id": file["id"],
                        "status": file.get("status", "Unknown status"),
                    }
                    for file in files
                ],
            }
            print(json.dumps(result))  # Output valid JSON
            return result
        else:
            error_message = response.json()
            result = {
                "success": False,
                "error": error_message,
            }
            print(json.dumps(result))  # Output error JSON
            return result
    except Exception as e:
        result = {
            "success": False,
            "error": str(e),
        }
        print(json.dumps(result))  # Output error JSON
        return result

if __name__ == "__main__":
    fetch_files()
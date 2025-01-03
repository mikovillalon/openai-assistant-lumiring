import requests

# Test the requests library
try:
    response = requests.get("https://api.github.com")
    print(f"Test Request Status Code: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
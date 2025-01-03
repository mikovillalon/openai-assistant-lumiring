from dotenv import load_dotenv
import os
import requests
import deeplake

# Load environment variables from the .env file
load_dotenv(dotenv_path="../nodejs-app/.env")

API_KEY = os.getenv("OPENAI_API_KEY")
if not API_KEY:
    raise ValueError("API Key not loaded. Check the .env file path and ensure the key exists.")

VECTOR_STORE_ID = "vs_YP0hD5jHTowvBMWAST2mSBZW"
DEEPLAKE_PATH = "./lumiring_files"

def fetch_files():
    """Fetch files from the OpenAI vector store."""
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
            return response.json()["data"]
        else:
            print(f"Error fetching files: {response.json()}")
            return []
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return []

def initialize_deeplake_dataset():
    """Initialize or create a Deep Lake dataset."""
    try:
        print("Initializing or creating dataset.")

        # Check if the dataset exists and is valid
        if os.path.exists(DEEPLAKE_PATH):
            try:
                print("Dataset exists. Attempting to load.")
                ds = deeplake.load(DEEPLAKE_PATH)
                print("Dataset loaded successfully.")
            except Exception as e:
                print(f"Error loading dataset: {e}")
                print("Reinitializing dataset as it seems corrupted or invalid.")
                ds = deeplake.empty(DEEPLAKE_PATH)
        else:
            print("Dataset does not exist. Creating a new dataset.")
            ds = deeplake.empty(DEEPLAKE_PATH)

        print("Dataset initialized successfully.")

        # Add tensors if they don't exist
        if "file_id" not in ds.tensors:
            ds.create_tensor("file_id", htype="text")
            print("Tensor 'file_id' created.")
        else:
            # Clear existing data
            ds["file_id"].clear()

        if "status" not in ds.tensors:
            ds.create_tensor("status", htype="text")
            print("Tensor 'status' created.")
        else:
            # Clear existing data
            ds["status"].clear()

        return ds
    except Exception as e:
        print(f"Error initializing dataset: {str(e)}")
        return None

def store_files_in_deeplake():
    """Fetch files and store their metadata in Deep Lake."""
    files = fetch_files()
    if not files:
        print("No files to store.")
        return

    ds = initialize_deeplake_dataset()
    if not ds:
        print("Dataset initialization failed. Cannot store files.")
        return

    try:
        for file in files:
            file_id = file["id"]
            status = file.get("status", "Unknown status")
            print(f"Storing: File ID = {file_id}, Status = {status}")

            # Append data to tensors
            ds["file_id"].append(file_id)
            ds["status"].append(status)

            # Debugging: Print tensor contents after each append
            print("Current file_id tensor contents:", ds["file_id"].numpy().flatten().tolist())
            print("Current status tensor contents:", ds["status"].numpy().flatten().tolist())

        ds.flush()
        print("All files have been stored successfully.")
    except Exception as e:
        print(f"Error storing file data: {str(e)}")

if __name__ == "__main__":
    store_files_in_deeplake()
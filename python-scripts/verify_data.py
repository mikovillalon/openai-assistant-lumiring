from dotenv import load_dotenv
import deeplake
import json
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

# Load environment variables
load_dotenv(dotenv_path="../nodejs-app/.env")

DEEPLAKE_PATH = "./lumiring_files"

def verify_data():
    """Verify and print the contents of the Deep Lake dataset."""
    try:
        # Load the dataset
        ds = deeplake.load(DEEPLAKE_PATH)
        print(f"{DEEPLAKE_PATH} loaded successfully.")
        print("Inspecting dataset contents:")

        # Convert tensors to lists of Python-native types
        file_ids = ds["file_id"].numpy().flatten().tolist()
        statuses = ds["status"].numpy().flatten().tolist()

        # Prepare data for JSON output
        output_data = [{"file_id": file_id, "status": status} for file_id, status in zip(file_ids, statuses)]

        # Print JSON-formatted output
        print(json.dumps({"success": True, "data": output_data}, indent=2))
    except Exception as e:
        # Handle and display errors in JSON format
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    verify_data()
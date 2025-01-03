import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import axios from "axios";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());

const runPythonScript = (scriptName, callback) => {
  const scriptPath = path.join(__dirname, "../python-scripts", scriptName);
  exec(`python3 ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      callback(null, error.message);
      return;
    }
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
      callback(null, stderr);
      return;
    }
    callback(stdout, null);
  });
};

// Health check route
app.get("/", (req, res) => {
  res.send("OpenAI Assistant App with Deep Lake Integration is running!");
});

// Fetch files route
app.get("/fetch-files", (req, res) => {
  runPythonScript("fetch_files.py", (output, error) => {
    if (error) {
      res.status(500).json({ error: "Failed to execute fetch_files script", details: error });
    } else {
      try {
        const result = JSON.parse(output);
        res.status(200).json(result);
      } catch (parseError) {
        console.error("Failed to parse script output:", parseError);
        res.status(500).json({ error: "Failed to parse script output", details: parseError.message });
      }
    }
  });
});

// Store files in Deep Lake route
app.post("/store-files", (req, res) => {
  runPythonScript("store_files_deeplake.py", (output, error) => {
    if (error) {
      res.status(500).json({ error: "Failed to store files in Deep Lake", details: error });
    } else {
      res.status(200).json({ message: "Files stored successfully", output });
    }
  });
});

// Retrieve data from Deep Lake
app.get("/get-deeplake-data", (req, res) => {
  const scriptPath = path.join(__dirname, "../python-scripts/verify_data.py");
  exec(`python3 ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
          console.error(`Error: ${error.message}`);
          return res.status(500).json({ error: "Failed to retrieve Deep Lake data", details: error.message });
      }

      if (stderr) {
          console.warn(`Script stderr: ${stderr}`); // Log warning, but don't block response
      }

      try {
          const result = JSON.parse(stdout); // Parse JSON output from the Python script
          return res.status(200).json(result);
      } catch (parseError) {
          console.error("Failed to parse script output:", parseError);
          return res.status(500).json({ error: "Failed to parse script output", details: parseError.message });
      }
  });
});

// Webhook route
app.post("/webhook", async (req, res) => {
  try {
    const { user_id, message } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: "User ID and message are required." });
    }

    console.log(`Webhook received for user_id: ${user_id} with message: ${message}`);

    const threadResponse = await axios.post(
      "https://api.openai.com/v1/threads",
      {
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const messages = threadResponse.data.messages || [];
    const assistantReply = messages.find((msg) => msg.role === "assistant")?.content || "No response from assistant";

    console.log("Assistant reply:", assistantReply);

    res.json({ reply: assistantReply });
  } catch (error) {
    console.error("Error in webhook:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to process webhook request",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
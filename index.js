import express from "express"; // Import Express
import dotenv from "dotenv"; // Import dotenv for environment variables
import bodyParser from "body-parser"; // Import body-parser for parsing requests
import axios from "axios"; // Import axios for making HTTP requests
import fs from "fs"; // Import fs for reading configuration files

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON requests
app.use(bodyParser.json());

// Load assistant configuration from config.json
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

// In-memory storage for thread IDs (for development purposes)
const userThreads = {}; // { user_id: thread_id }

// Route: Webhook for handling messages
app.post("/webhook", async (req, res) => {
  try {
    const userId = req.body.user_id; // Unique user identifier
    const userMessage = req.body.message; // User input from request body

    if (!userId || !userMessage) {
      return res.status(400).json({
        error: "Invalid request",
        details: "Both 'user_id' and 'message' are required.",
      });
    }

    // Initialize or update the conversation history for the user
    if (!userThreads[userId]) {
      userThreads[userId] = [
        {
          role: "system",
          content: `
            Role: ${config.assistant.role} at ${config.assistant.company}.
            Objective: ${config.objective}.
            Behavioral Traits: ${config.behavioral_traits.join(", ")}.
          `,
        },
      ];
    }

    // Add the user's message to the conversation history
    userThreads[userId].push({ role: "user", content: userMessage });

    // Call the OpenAI API with the full conversation history
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        messages: userThreads[userId], // Send full conversation history
        model: config.assistant.model || "gpt-4", // Use the specified model
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // API key
          "OpenAI-Beta": "assistants=v2", // Required Beta Header
        },
      }
    );

    // Extract the assistant's reply
    const assistantReply = response.data.choices[0]?.message?.content || "No response from assistant";

    // Add the assistant's reply to the conversation history
    userThreads[userId].push({ role: "assistant", content: assistantReply });

    // Respond to the user
    res.json({
      reply: assistantReply,
    });
  } catch (error) {
    console.error("Error interacting with OpenAI Assistant:", error.response?.data || error.message);
    res.status(500).json({
      error: "Error interacting with the assistant",
      details: error.response?.data || error.message,
    });
  }
});

// Route: Health check
app.get("/", (req, res) => {
  res.send("OpenAI Assistant App is running!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
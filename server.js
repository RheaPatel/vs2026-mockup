import { CopilotClient } from "@github/copilot-sdk";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// --- Copilot SDK setup ---
console.log("[SDK] Initializing CopilotClient...");
const client = new CopilotClient();
console.log("[SDK] Creating streaming session with model: gpt-4.1");
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  systemMessage: {
    content:
      "You are GitHub Copilot inside Visual Studio 2026. Answer concisely about coding topics. When showing code, use markdown fenced code blocks with the language specified.",
  },
});
console.log("[SDK] Session created successfully");

// Track the current HTTP response being streamed to
let currentRes = null;
let tokenCount = 0;

// Helper to send log to browser
function sendLog(msg) {
  console.log(msg);
  if (currentRes) {
    currentRes.write(`data: ${JSON.stringify({ log: msg })}\n\n`);
  }
}

session.on("assistant.message_delta", (event) => {
  tokenCount++;
  const chunk = event.data.deltaContent;
  sendLog(`[SDK] Token #${tokenCount}: "${chunk.replace(/\n/g, "\\n")}"`);
  if (currentRes) {
    currentRes.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
  }
});

session.on("session.idle", () => {
  sendLog(`[SDK] Response complete. Total tokens: ${tokenCount}`);
  tokenCount = 0;
  if (currentRes) {
    currentRes.write("data: [DONE]\n\n");
    currentRes.end();
    currentRes = null;
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  const lastMessage = messages[messages.length - 1];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  currentRes = res;

  sendLog(`[API] POST /api/chat`);
  sendLog(`[API] User prompt: "${lastMessage.content}"`);
  sendLog(`[SDK] Sending to Copilot SDK...`);

  try {
    await session.sendAndWait({ prompt: lastMessage.content });
  } catch (err) {
    sendLog(`[SDK] Error: ${err.message}`);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
    currentRes = null;
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);

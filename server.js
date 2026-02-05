import { CopilotClient, defineTool } from "@github/copilot-sdk";
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Project directory to work with (can be changed)
let PROJECT_DIR = process.env.PROJECT_DIR || process.cwd();

// --- Define Tools using defineTool API ---
const readFileTool = defineTool("readFile", {
  description: "Read the contents of a file in the project. Use this to understand existing code before making changes.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "The file path to read (relative to project root)" }
    },
    required: ["path"]
  },
  handler: async (args) => {
    const filePath = args.path.startsWith("/") ? args.path : path.join(PROJECT_DIR, args.path);
    sendLog(`[Tool:readFile] Reading file: ${args.path}`);
    sendToolEvent("readFile", { path: args.path }, "running");
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split('\n').length;
      const bytes = content.length;
      sendLog(`[Tool:readFile] Success: ${args.path} (${lines} lines, ${bytes} bytes)`);
      sendToolEvent("readFile", { path: args.path, lines, bytes }, "success");
      return { success: true, content, path: filePath };
    } catch (err) {
      sendLog(`[Tool:readFile] Error: ${err.message}`);
      sendToolEvent("readFile", { path: args.path, error: err.message }, "error");
      return { success: false, error: err.message };
    }
  }
});

const writeFileTool = defineTool("writeFile", {
  description: "Write content to a file in the project. Always write the complete file content. The file will be created if it doesn't exist.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "The file path to write (relative to project root)" },
      content: { type: "string", description: "The complete file content to write" }
    },
    required: ["path", "content"]
  },
  handler: async (args) => {
    const filePath = args.path.startsWith("/") ? args.path : path.join(PROJECT_DIR, args.path);
    const lines = args.content.split('\n').length;
    const bytes = args.content.length;
    sendLog(`[Tool:writeFile] Writing file: ${args.path} (${lines} lines, ${bytes} bytes)`);
    sendToolEvent("writeFile", { path: args.path }, "running");
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(filePath, args.content, "utf-8");
      sendLog(`[Tool:writeFile] Success: ${args.path} written to disk`);
      sendToolEvent("writeFile", { path: args.path, bytesWritten: bytes, lines }, "success");
      return { success: true, message: `File written: ${filePath}`, path: filePath };
    } catch (err) {
      sendLog(`[Tool:writeFile] Error: ${err.message}`);
      sendToolEvent("writeFile", { path: args.path, error: err.message }, "error");
      return { success: false, error: err.message };
    }
  }
});

const listFilesTool = defineTool("listFiles", {
  description: "List files and directories in a given path. Use this to explore the project structure.",
  parameters: {
    type: "object",
    properties: {
      directory: { type: "string", description: "The directory path to list (use '.' for project root)" }
    },
    required: ["directory"]
  },
  handler: async (args) => {
    const dir = args.directory === "." ? PROJECT_DIR :
                args.directory.startsWith("/") ? args.directory : path.join(PROJECT_DIR, args.directory);
    sendLog(`[Tool:listFiles] Listing directory: ${args.directory}`);
    sendToolEvent("listFiles", { directory: args.directory }, "running");
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = entries
        .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
        .map(e => ({ name: e.name, isDirectory: e.isDirectory() }));
      const dirs = files.filter(f => f.isDirectory).length;
      const regularFiles = files.length - dirs;
      sendLog(`[Tool:listFiles] Found ${regularFiles} files, ${dirs} directories in ${args.directory}`);
      sendToolEvent("listFiles", { directory: args.directory, count: files.length, files: regularFiles, dirs }, "success");
      return { success: true, files, directory: dir };
    } catch (err) {
      sendLog(`[Tool:listFiles] Error: ${err.message}`);
      sendToolEvent("listFiles", { directory: args.directory, error: err.message }, "error");
      return { success: false, error: err.message };
    }
  }
});

// --- Authentication Status ---
let authStatus = { authenticated: false, user: null, error: null };
let copilotReady = false;

// Find gh command path
const GH_CMD = process.platform === 'darwin'
  ? '/opt/homebrew/bin/gh'
  : 'gh';

async function checkAuth() {
  try {
    // Check auth status
    const { stdout } = await execAsync(`${GH_CMD} auth status 2>&1`);
    const userMatch = stdout.match(/Logged in to github\.com account (\S+)/i) ||
                      stdout.match(/Logged in to github\.com as (\S+)/i);

    // Get token and set environment variable for Copilot SDK
    try {
      const { stdout: token } = await execAsync(`${GH_CMD} auth token`);
      process.env.GH_TOKEN = token.trim();
    } catch (e) {
      // Token fetch failed but we're still authenticated
    }

    authStatus = {
      authenticated: true,
      user: userMatch ? userMatch[1] : 'authenticated',
      error: null
    };
    return true;
  } catch (err) {
    authStatus = {
      authenticated: false,
      user: null,
      error: 'Not authenticated with GitHub CLI'
    };
    return false;
  }
}

// Auth status endpoint
app.get("/api/auth/status", async (req, res) => {
  await checkAuth();
  res.json({
    ...authStatus,
    copilotReady,
    instructions: !authStatus.authenticated ? [
      "1. Install GitHub CLI: brew install gh",
      "2. Run: gh auth login",
      "3. Choose GitHub.com, HTTPS, and authenticate",
      "4. Refresh this page"
    ] : null
  });
});

// Start auth flow
app.post("/api/auth/login", async (req, res) => {
  try {
    // This will start the device flow
    const { stdout, stderr } = await execAsync('/opt/homebrew/bin/gh auth login -h github.com -p https -w 2>&1 || gh auth login -h github.com -p https -w 2>&1', {
      timeout: 120000
    });
    await checkAuth();
    res.json({ success: authStatus.authenticated, output: stdout || stderr });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// --- File System API ---
app.get("/api/files", async (req, res) => {
  const dir = req.query.dir || PROJECT_DIR;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = entries
      .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
      .map(e => ({
        name: e.name,
        path: path.join(dir, e.name),
        isDirectory: e.isDirectory()
      }))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    res.json({ files, root: dir });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/file", async (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: "Missing path" });
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const ext = path.extname(filePath).slice(1);
    res.json({ content, path: filePath, extension: ext });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/file", async (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: "Missing path" });
  try {
    await fs.writeFile(filePath, content, "utf-8");
    res.json({ success: true, path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/project", (req, res) => {
  const { dir } = req.body;
  if (dir) PROJECT_DIR = dir;
  res.json({ projectDir: PROJECT_DIR });
});

// --- Copilot SDK setup ---
let client = null;

async function initCopilot() {
  if (client) return true;

  const isAuth = await checkAuth();
  if (!isAuth) {
    console.log("[SDK] Not authenticated - Copilot features disabled");
    return false;
  }

  try {
    console.log("[SDK] Initializing CopilotClient...");
    client = new CopilotClient();
    copilotReady = true;
    console.log("[SDK] CopilotClient ready");
    return true;
  } catch (err) {
    console.error("[SDK] Failed to initialize:", err.message);
    authStatus.error = err.message;
    return false;
  }
}

// Initialize on startup
initCopilot();

// Track sessions by mode
const sessions = {};

async function getOrCreateSession(mode = "ask") {
  // Make sure Copilot is initialized
  if (!client) {
    const ready = await initCopilot();
    if (!ready) {
      throw new Error("GitHub authentication required. Please run 'gh auth login' and restart the server.");
    }
  }

  if (sessions[mode]) return sessions[mode];

  const systemPrompts = {
    ask: "You are GitHub Copilot inside Visual Studio 2026. Answer concisely about coding topics. When showing code, use markdown fenced code blocks with the language specified.",
    agent: `You are GitHub Copilot Agent inside Visual Studio 2026. You are a fully autonomous coding agent that can read, understand, and modify code.

## Your Tools
- **listFiles(directory)**: List files in a directory. Use "." for project root.
- **readFile(path)**: Read a file's contents to understand existing code.
- **writeFile(path, content)**: Create or overwrite a file with complete content.

## CRITICAL INSTRUCTIONS

1. **ALWAYS explore first**: Before making any changes, use listFiles and readFile to understand the existing codebase structure and code patterns.

2. **Be thorough**:
   - List the project directory to see what files exist
   - Read relevant files to understand the current implementation
   - Only then make informed changes

3. **ALWAYS use tools**: You MUST use the tools to make changes. Never just describe code - actually write it using writeFile.

4. **Complete files only**: When using writeFile, always write the COMPLETE file content, not just snippets.

5. **Follow existing patterns**: Match the coding style, naming conventions, and structure of existing code.

## Example workflow for "build me a tic-tac-toe app":
1. listFiles(".") - see what exists
2. readFile relevant files - understand the project setup
3. writeFile to create/modify files with complete implementations
4. Confirm what you created

You are autonomous - take action, don't ask for permission. Execute the full workflow using your tools.`
  };

  console.log(`[SDK] Creating session for mode: ${mode}`);

  const sessionConfig = {
    model: "gpt-4.1",
    streaming: true,
    systemMessage: { content: systemPrompts[mode] || systemPrompts.ask }
  };

  // Add tools for agent mode
  if (mode === "agent") {
    sessionConfig.tools = [readFileTool, writeFileTool, listFilesTool];
  }

  const session = await client.createSession(sessionConfig);
  sessions[mode] = session;

  return session;
}

// Track the current HTTP response being streamed to
let currentRes = null;
let currentMode = "ask";
let tokenCount = 0;

// Helper to send events to browser
function sendEvent(type, data) {
  if (currentRes) {
    currentRes.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  }
}

function sendLog(msg) {
  console.log(msg);
  sendEvent("log", { message: msg });
}

function sendText(text) {
  sendEvent("text", { content: text });
}

function sendToolCall(name, args, result) {
  sendEvent("tool", { name, args, result });
}

function sendToolEvent(toolName, data, status) {
  console.log(`[Tool:${toolName}] ${status}:`, JSON.stringify(data));
  sendEvent("toolStatus", { tool: toolName, status, ...data });
}


// Setup event handlers for a session
function setupSessionHandlers(session) {
  session.on("assistant.message_delta", (event) => {
    tokenCount++;
    const chunk = event.data.deltaContent;
    if (tokenCount <= 3) {
      sendLog(`[SDK] Token #${tokenCount}: "${chunk.replace(/\n/g, "\\n")}"`);
    }
    sendText(chunk);
  });

  // Tools defined with defineTool() have their own handlers
  // This event is for logging purposes
  session.on("tool.invocation", (event) => {
    const { name, arguments: args } = event.data || {};
    if (name) {
      sendLog(`[SDK] ⚡ Tool invoked: ${name}`);
      if (args) {
        const argStr = JSON.stringify(args).slice(0, 100);
        sendLog(`[SDK]    Args: ${argStr}${argStr.length >= 100 ? '...' : ''}`);
      }
    }
  });

  session.on("tool.result", (event) => {
    const { name, result } = event.data || {};
    if (name) {
      const success = result?.success !== false;
      sendLog(`[SDK] ${success ? '✓' : '✗'} Tool result: ${name} - ${success ? 'success' : 'failed'}`);
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
}

app.post("/api/chat", async (req, res) => {
  const { messages, mode = "ask" } = req.body;
  const lastMessage = messages[messages.length - 1];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  currentRes = res;
  currentMode = mode;
  tokenCount = 0;

  sendLog(`[API] POST /api/chat (mode: ${mode})`);
  sendLog(`[API] User prompt: "${lastMessage.content.slice(0, 100)}${lastMessage.content.length > 100 ? '...' : ''}"`);

  try {
    const session = await getOrCreateSession(mode);

    // Setup handlers if not already done
    if (!session._handlersSetup) {
      setupSessionHandlers(session);
      session._handlersSetup = true;
    }

    sendLog(`[SDK] Sending to Copilot SDK...`);
    await session.sendAndWait({ prompt: lastMessage.content });
  } catch (err) {
    sendLog(`[SDK] Error: ${err.message}`);
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
    res.end();
    currentRes = null;
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Project directory: ${PROJECT_DIR}`);
});

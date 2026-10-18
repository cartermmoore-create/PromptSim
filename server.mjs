import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, userInfo } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4173);
const APP_ORIGIN = "http://" + HOST + ":" + PORT;
const MAX_BODY_BYTES = 1_000_000;
const SERVICE_NAME = "PromptSim ChatGPT Runtime";
const SDK_ENTRY = process.env.PROMPTSIM_SIWC_ENTRY || join(ROOT, ".runtime", "sign-in-with-chatgpt-devkit", "packages", "local", "dist", "index.js");

const CODING_SYSTEM_PROMPT = [
  "You are PromptSim's AI coding agent. Build complete, original, runnable websites and browser games from the user request.",
  'Return only one valid JSON object with keys "html", "css", "js", and "summary". Every value must be a JSON string. No Markdown fences and no extra prose.',
  '"html" must be a complete HTML5 document that links to ./styles.css in the head and ./script.js near the end of body. "css" contains all styles. "js" contains working interactions.',
  "Write real playable code, not a static mockup, checklist, or TODO list. Implement buttons, navigation, forms, game controls, collision/scoring/restart behavior, and responsive layout as requested. Keep the implementation focused and concise.",
  "Use original visuals and text. Do not copy another creator's source project, layout, art, text, or exact mechanics. Avoid placeholder TODOs and unnecessary dependencies.",
  "Do not include secrets. Prefer a self-contained browser project. Do not use document.write. Protect against HTML injection when rendering user input.",
  "When editing an existing project, preserve working features and change only what the user requested. The summary briefly describes what changed."
].join("\n");

function runProcess(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      ...options
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr?.on("data", chunk => { stderr += chunk.toString(); });
    child.once("error", rejectPromise);
    child.once("close", code => {
      if (code === 0) resolvePromise(stdout.trim());
      else rejectPromise(new Error(stderr.trim() || (command + " exited with code " + code)));
    });
  });
}

async function openExternal(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "auth.openai.com") {
    throw new Error("The sign-in flow requested an unexpected browser destination.");
  }
  let command;
  let args;
  if (process.platform === "win32") {
    command = "rundll32.exe";
    args = ["url.dll,FileProtocolHandler", parsed.href];
  } else if (process.platform === "darwin") {
    command = "open";
    args = [parsed.href];
  } else {
    command = "xdg-open";
    args = [parsed.href];
  }
  const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  child.once("error", () => {
    console.warn("Could not open the sign-in browser automatically. Open the authorization link from the system prompt.");
  });
  child.unref();
}

async function browserOpenApp() {
  let command;
  let args;
  if (process.platform === "win32") {
    command = "rundll32.exe";
    args = ["url.dll,FileProtocolHandler", APP_ORIGIN];
  } else if (process.platform === "darwin") {
    command = "open";
    args = [APP_ORIGIN];
  } else {
    command = "xdg-open";
    args = [APP_ORIGIN];
  }
  const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  child.once("error", () => console.log("Open " + APP_ORIGIN + " in your browser."));
  child.unref();
}

function getDataDirectory() {
  if (process.platform === "win32") {
    return join(process.env.LOCALAPPDATA || process.env.APPDATA || homedir(), "PromptSim");
  }
  if (process.platform === "darwin") return join(homedir(), "Library", "Application Support", "PromptSim");
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "PromptSim");
}

async function powershell(script, env) {
  return runProcess("powershell.exe", [
    "-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script
  ], { env: { ...process.env, ...env } });
}

async function loadOrCreateEncryptionKey(dataDir) {
  const username = userInfo().username || "current-user";
  if (process.platform === "win32") {
    const encryptedPath = join(dataDir, "credential-key.dpapi");
    if (existsSync(encryptedPath)) {
      const encrypted = await readFile(encryptedPath, "utf8");
      const script = "$s = ConvertTo-SecureString -String $env:PROMPTSIM_PROTECTED_KEY -ErrorAction Stop; $p = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($p) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }";
      const secret = await powershell(script, { PROMPTSIM_PROTECTED_KEY: encrypted.trim() });
      return Buffer.from(secret, "base64");
    }
    const secret = randomBytes(32).toString("base64");
    const script = "$s = ConvertTo-SecureString -String $env:PROMPTSIM_MASTER_KEY -AsPlainText -Force; ConvertFrom-SecureString -SecureString $s";
    const protectedKey = await powershell(script, { PROMPTSIM_MASTER_KEY: secret });
    await writeFile(encryptedPath, protectedKey + "\n", { mode: 0o600 });
    return Buffer.from(secret, "base64");
  }

  if (process.platform === "darwin") {
    try {
      const existing = await runProcess("security", ["find-generic-password", "-a", username, "-s", SERVICE_NAME, "-w"]);
      return Buffer.from(existing, "base64");
    } catch {
      const secret = randomBytes(32).toString("base64");
      await runProcess("security", ["add-generic-password", "-U", "-a", username, "-s", SERVICE_NAME, "-w", secret]);
      return Buffer.from(secret, "base64");
    }
  }

  // Linux uses the desktop Secret Service; the app intentionally refuses a plaintext key-file fallback.
  try {
    const existing = await runProcess("secret-tool", ["lookup", "application", "promptsim", "key", "chatgpt-runtime"]);
    return Buffer.from(existing, "base64");
  } catch {
    const secret = randomBytes(32).toString("base64");
    try {
      await new Promise((resolvePromise, rejectPromise) => {
        const child = spawn("secret-tool", ["store", "--label=PromptSim ChatGPT Runtime", "application", "promptsim", "key", "chatgpt-runtime"], { stdio: ["pipe", "pipe", "pipe"] });
        let stderr = "";
        child.stderr.on("data", chunk => { stderr += chunk.toString(); });
        child.once("error", rejectPromise);
        child.once("close", code => code === 0 ? resolvePromise() : rejectPromise(new Error(stderr.trim() || "Secret Service unavailable")));
        child.stdin.end(secret);
      });
      return Buffer.from(secret, "base64");
    } catch {
      throw new Error("Secure credential storage isn't available. On Linux, install and unlock Secret Service/libsecret (the secret-tool command) before using ChatGPT sign-in.");
    }
  }
}

function makeCredentialEncryption(key) {
  return {
    id: "promptsim-os-keyring-aes-gcm-v1",
    isAvailable: () => key instanceof Uint8Array && key.byteLength === 32,
    encrypt(plaintext) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
      const tag = cipher.getAuthTag();
      return Buffer.concat([iv, tag, ciphertext]);
    },
    decrypt(ciphertext) {
      const bytes = Buffer.from(ciphertext);
      if (bytes.length < 29) throw new Error("Invalid encrypted credential");
      const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
      decipher.setAuthTag(bytes.subarray(12, 28));
      return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
    }
  };
}

function sendJSON(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  res.end(payload);
}

async function readJSON(req) {
  let length = 0;
  const chunks = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_BODY_BYTES) throw Object.assign(new Error("Request too large."), { statusCode: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Object.assign(new Error("Invalid JSON request."), { statusCode: 400 }); }
}

function checkLocalRequest(req) {
  const host = req.headers.host || "";
  const origin = req.headers.origin;
  const hostOkay = host === HOST + ":" + PORT || host === "localhost:" + PORT;
  const originOkay = !origin || origin === APP_ORIGIN || origin === "http://localhost:" + PORT;
  return hostOkay && originOkay;
}

function safeError(error) {
  const message = error?.message || String(error);
  if (/token|bearer|authorization code|refresh_token/i.test(message)) {
    return "ChatGPT connection failed. Reconnect from PromptSim and approve ChatGPT plan usage if prompted.";
  }
  return message.slice(0, 700);
}

const dataDir = getDataDirectory();
await mkdir(dataDir, { recursive: true });
const encryptionKey = await loadOrCreateEncryptionKey(dataDir);
const encryption = makeCredentialEncryption(encryptionKey);
if (!existsSync(SDK_ENTRY)) {
  console.error("The official ChatGPT runtime is missing. Start PromptSim with npm run local so setup can build it.");
  process.exit(1);
}
const sdk = await import(pathToFileURL(resolve(SDK_ENTRY)).href);
const chatgpt = sdk.createChatGPT({
  appName: "PromptSim",
  appId: "promptsim",
  redirectPort: 0,
  storageDir: join(dataDir, "chatgpt"),
  credentialEncryption: encryption,
  openBrowser: openExternal,
  sendHostId: true
});

async function api(req, res, url) {
  if (!checkLocalRequest(req)) {
    sendJSON(res, 403, { error: "This local AI endpoint only accepts requests from PromptSim running on this device." });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/status") {
    sendJSON(res, 200, { runtime: "local", session: await chatgpt.getSession() });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/sign-in") {
    const previous = await chatgpt.getSession();
    const session = await chatgpt.signIn({ reconsent: previous.status === "connected" && !previous.sharing });
    sendJSON(res, session.sharing ? 200 : 403, {
      session,
      error: session.sharing ? undefined : "Your ChatGPT account did not enable plan usage for PromptSim. Complete the permission prompt or check whether your plan is eligible."
    });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/disconnect") {
    await chatgpt.disconnect();
    sendJSON(res, 200, { session: await chatgpt.getSession() });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/models") {
    const session = await chatgpt.getSession();
    if (!session.sharing) {
      sendJSON(res, 403, { error: "Connect a ChatGPT account and enable plan usage first.", session });
      return true;
    }
    sendJSON(res, 200, { models: await chatgpt.listModels() });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/generate") {
    const session = await chatgpt.getSession();
    if (!session.sharing) {
      sendJSON(res, 403, { error: "Connect ChatGPT and explicitly enable plan usage before generating code." });
      return true;
    }
    const body = await readJSON(req);
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const model = typeof body.model === "string" ? body.model : "";
    if (!prompt) {
      sendJSON(res, 400, { error: "Describe the website or browser game you want to build." });
      return true;
    }
    if (prompt.length > 160000) {
      sendJSON(res, 413, { error: "This project context is too large. Try a smaller request or remove unused code." });
      return true;
    }
    const models = await chatgpt.listModels();
    if (!models.some(item => item.slug === model)) {
      sendJSON(res, 400, { error: "That model is not available to the connected ChatGPT account. Refresh the model list." });
      return true;
    }
    const result = await chatgpt.streamResponse({
      model,
      instructions: CODING_SYSTEM_PROMPT,
      input: prompt
    });
    if (!result.text || !result.text.trim()) {
      sendJSON(res, 502, { error: "The model returned an empty response. Try a simpler prompt." });
      return true;
    }
    sendJSON(res, 200, { text: result.text });
    return true;
  }

  return false;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", APP_ORIGIN);
    if (url.pathname.startsWith("/api/")) {
      if (req.method !== "GET" && req.method !== "POST") {
        sendJSON(res, 405, { error: "Method not allowed." });
        return;
      }
      const handled = await api(req, res, url);
      if (!handled) sendJSON(res, 404, { error: "Endpoint not found." });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405); res.end("Method not allowed"); return;
    }
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { res.writeHead(400); res.end("Invalid URL"); return; }
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    if (relative.split(/[\\/]/).some(part => part === ".." || part.startsWith(".")) ||
        !(relative === "index.html" || relative === "styles.css" || relative === "script.js" || relative.startsWith("assets/"))) {
      res.writeHead(404, { "X-Content-Type-Options": "nosniff" });
      res.end("Not found");
      return;
    }
    const file = resolve(ROOT, relative);
    if (!file.startsWith(ROOT + sep)) {
      res.writeHead(404); res.end("Not found"); return;
    }
    const contents = await readFile(file);
    res.writeHead(200, {
      "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    });
    if (req.method === "HEAD") res.end(); else res.end(contents);
  } catch (error) {
    const status = error?.statusCode || 500;
    if (!res.headersSent) sendJSON(res, status, { error: safeError(error) });
    else res.end();
    if (status >= 500) console.error("PromptSim runtime error:", error?.message || error);
  }
});

server.on("error", error => {
  if (error.code === "EADDRINUSE") console.error("Port " + PORT + " is already in use. Close the other PromptSim instance or run with PORT=4174.");
  else console.error("PromptSim server error:", error.message);
  process.exitCode = 1;
});
server.listen(PORT, HOST, () => {
  console.log("\nPromptSim is running in your browser at " + APP_ORIGIN);
  console.log("AI requests run remotely through your authorized ChatGPT plan. No local language model is downloaded.");
  console.log("Press Ctrl+C to stop PromptSim.");
  browserOpenApp().catch(error => console.warn("Open your browser manually at " + APP_ORIGIN, error.message));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

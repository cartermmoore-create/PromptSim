import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeRoot = join(root, ".runtime");
const sdkRoot = join(runtimeRoot, "sign-in-with-chatgpt-devkit");
const sdkEntry = join(sdkRoot, "packages", "local", "dist", "index.js");

function run(command, args, cwd, label) {
  console.log("\n> " + command + " " + args.join(" "));
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    windowsHide: true
  });
  if (result.error) throw new Error(label + ": " + result.error.message);
  if (result.status !== 0) throw new Error(label + " failed with exit code " + result.status);
}

function commandName(name) {
  return process.platform === "win32" && name === "npm" ? "npm.cmd" : name;
}

const version = process.versions.node.split(".").map(Number);
if (version[0] < 22 || (version[0] === 22 && version[1] < 12)) {
  console.error("PromptSim's ChatGPT sign-in runtime requires Node.js 22.12 or newer.");
  console.error("Install a current Node.js LTS release, then run npm run local again.");
  process.exit(1);
}

mkdirSync(runtimeRoot, { recursive: true });
try {
  if (!existsSync(join(sdkRoot, ".git"))) {
    if (existsSync(sdkRoot)) throw new Error("The .runtime/sign-in-with-chatgpt-devkit folder exists but is not a Git checkout. Delete that folder and try again.");
    run("git", ["clone", "--depth", "1", "https://github.com/openai/sign-in-with-chatgpt-devkit.git", sdkRoot], root, "Download the official Sign in with ChatGPT DevKit");
  }

  if (!existsSync(sdkEntry)) {
    run(commandName("npm"), ["install", "--workspace=@siwc/local"], sdkRoot, "Install the official local ChatGPT runtime dependencies");
    run(commandName("npm"), ["run", "build", "--workspace=@siwc/local"], sdkRoot, "Build the official local ChatGPT runtime");
  }

  console.log("\nStarting PromptSim in your browser.");
  console.log("The model runs remotely through your authorized ChatGPT plan; no local language model is downloaded.");
  const result = spawnSync(process.execPath, [join(root, "server.mjs")], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PROMPTSIM_SIWC_ENTRY: sdkEntry },
    windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && result.status !== null) process.exitCode = result.status;
} catch (error) {
  console.error("\nPromptSim could not start: " + (error?.message || String(error)));
  console.error("\nYou'll need Git and Node.js 22.12+ for the supported local ChatGPT-plan flow.");
  process.exitCode = 1;
}

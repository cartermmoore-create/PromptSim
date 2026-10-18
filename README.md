# PromptSim

PromptSim is a galaxy-themed AI coding workspace and project discovery gallery.

## Live website

https://cartermmoore-create.github.io/PromptSim/

## AI coding workspace

Open **AI Studio** or click **Create**. Describe a website or browser game, choose a model, and press **Build with AI**. The coding agent generates three real source files (`index.html`, `styles.css`, and `script.js`), loads them into a sandboxed live preview, and lets you ask follow-up prompts to update the existing code.

Available model choices:
- Gemini 3.8 Flash
- Claude Sonnet 5
- GPT-5.6 Luna

AI calls use [Puter.js](https://docs.puter.com/AI/chat/), so PromptSim does not embed a private API key or require a deployed backend. Users may need to sign in through Puter. AI usage is subject to the user's Puter account, model availability, and usage limits.

Features include:
- Editable HTML, CSS, and JavaScript source
- Sandboxed preview and live refresh while editing
- ZIP download containing the generated source files
- Optional publishing through Puter hosting
- Browser-local draft saving

## Creator attribution

The six reference projects keep the creator handles visible. The remix workflow tells the model to create a distinct project from a high-level inspiration rather than copying the source project's code, layout, art, text, or exact mechanics. The source card is never overwritten.

## Run locally

Serve the folder with a local HTTP server (for example, `python -m http.server`) or use GitHub Pages. The Puter.js SDK requires a supported website origin; opening index.html directly with a `file://` URL may not support sign-in.

## Notes

Generated websites run inside a sandboxed iframe in PromptSim. Review generated code and external dependencies before publishing. AI-generated code can contain bugs and may need follow-up changes. The gallery's sample metrics and sample projects are illustrative.
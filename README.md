# PromptSim

PromptSim is a galaxy-themed AI coding workspace and project discovery gallery.

## Live website

https://cartermmoore-create.github.io/PromptSim/

## AI coding workspace

Click the **+ / Create** button or open **AI Studio**. The plus button starts a fresh, full-screen project workspace like a coding-agent editor: live preview on the left, the LLM conversation and prompt box on the right, and a source-code tool panel.

Describe a website or browser game, choose a model from the live Puter model catalogue, and press **Build**. The coding agent generates complete `index.html`, `styles.css`, and `script.js` files. Follow-up prompts send the current files to the model so it can edit the existing project. You can preview desktop/mobile layouts, edit source files, download a ZIP, view local build history, and publish through Puter hosting.

AI calls use [Puter.js](https://docs.puter.com/AI/chat/) and the available model identifiers are loaded at runtime through Puter's model catalogue. Sign-in, model availability, and usage limits depend on Puter's service and your account.

## Creator ownership

There are **no preloaded showcase projects** copied from the reference screenshot. The homepage begins empty and lets the user build something original. Projects created in the browser are saved locally, and the source project's card is not overwritten during a remix. A remix prompt directs the model to take only high-level inspiration and make distinct code, layout, graphics, text, and mechanics.

## Run locally

Serve the folder with a local HTTP server (for example, `python -m http.server`) or use GitHub Pages. The Puter.js SDK needs a supported website origin; opening `index.html` with a `file://` URL may not support sign-in.

## Notes

Generated sites execute inside a sandboxed iframe in PromptSim. Review generated code and external dependencies before publishing. AI-generated code can contain bugs and may need follow-up changes. The homepage does not ship with sample project cards.
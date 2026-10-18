# PromptSim

PromptSim is a galaxy-themed AI coding workspace and project discovery gallery.

## Live website

https://cartermmoore-create.github.io/PromptSim/

## Local AI coding workspace

Click the **+ / Create** button or open **AI Studio**. The plus button starts a fresh, full-screen workspace with a live preview on the left and the coding-agent conversation on the right.

PromptSim uses [WebLLM](https://github.com/mlc-ai/web-llm) to run a small language model locally in the browser. It does not call Puter or a hosted LLM API, and it does not need an API key, credits, or model account. The browser downloads model weights on first use and caches them. The selected local model needs WebGPU and approximately 0.9 GB GPU memory for the 1B option or 2.3 GB for the 3B option. Exact download size and performance depend on the model build and browser.

Choose Llama 3.2 3B for better output or Llama 3.2 1B for lower memory usage, then press **Load model** or **Build**. The agent generates `index.html`, `styles.css`, and `script.js`; follow-up prompts can edit existing code. The UI includes a sandboxed preview, desktop/mobile modes, an editable source panel, local build history, ZIP export, and a publish/export control.

Local models are less capable than large hosted coding models and may struggle with large projects, long code context, or complex changes. The first model download can take several minutes. WebGPU is required; if it is unavailable, try updating the browser and enabling hardware acceleration.

## Creator ownership

The homepage has **no preloaded showcase projects** copied from the reference screenshot. It starts empty and prompts you to build something original. The source project's card is not overwritten during a remix, and the remix prompt asks for a distinct implementation rather than copying code, layout, graphics, text, or exact mechanics.

## Run locally

Serve the folder with a local HTTP server (for example, `python -m http.server`) or use GitHub Pages. WebGPU requires a secure, supported browser origin; opening `index.html` via `file://` may not work. Model weights are downloaded from the WebLLM model hosts the first time, then cached by your browser.

## Notes

Generated sites execute inside a sandboxed iframe in PromptSim. Review generated code and external dependencies before publishing. AI-generated code can contain bugs and may need follow-up changes. The homepage does not ship with sample project cards.
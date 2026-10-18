# PromptSim

PromptSim is a galaxy-themed AI coding workspace and project discovery gallery. It generates websites and browser games, then runs them in an embedded browser preview.

## Live website

https://cartermmoore-create.github.io/PromptSim/

## Use your ChatGPT subscription

The public GitHub Pages version is a static website. OpenAI currently limits direct ChatGPT-plan usage to eligible open-source/local apps and approved hosted integrations. PromptSim is set up for the supported local-runtime path; requesting hosted access is a separate step. See the [official open-source SIWC docs](https://developers.openai.com/siwc/token-sharing-open-source) and [hosted access request](https://openai.com/form/sign-in-with-chatgpt-interest/).

### Run PromptSim locally (recommended)

This does **not** download or run a language model on your computer. The local process securely connects to your ChatGPT account, while OpenAI runs the model and the generated website/game plays in the browser preview.

Requirements: Git and Node.js 22.12 or newer.

1. Download or clone this repository to your computer.
2. Open a terminal in the PromptSim folder.
3. Run:

   `npm run local`

The launcher downloads the official OpenAI [Sign in with ChatGPT DevKit](https://github.com/openai/sign-in-with-chatgpt-devkit) into a local `.runtime` folder, installs its dependencies, and starts PromptSim at `http://127.0.0.1:4173`. The official SDK handles sign-in and ChatGPT-plan requests; PromptSim stores credentials encrypted using the operating system's protected credential store.

4. In the browser window that opens, click **Continue with ChatGPT** and finish the sign-in and plan-usage consent flow.
5. Choose a model available to your account, describe a website or game, and press **Build**. The generated files run in the live browser preview; follow-up prompts can modify the project.

To stop PromptSim, return to the terminal and press Ctrl+C.

### Why does the hosted page show a message?

GitHub Pages cannot securely provide the open-source local OAuth callback. Offering ChatGPT-plan use directly in a remotely hosted website requires OpenAI approval. The hosted page therefore points to the local runtime setup and the official [hosted access request](https://openai.com/form/sign-in-with-chatgpt-interest/) rather than pretending subscription access is already approved.

## Workspace features

- Full-screen coding workspace: browser preview on the left, AI conversation on the right.
- Actual remote LLM generation through the authorized ChatGPT plan in the local-runtime mode.
- HTML, CSS, and JavaScript files with a source editor and sandboxed preview.
- Desktop/mobile preview modes, local build history, text file attachments, and ZIP export.
- Projects and drafts stored locally in your browser; the homepage contains no copied demo projects.

## Creator ownership

The homepage has no preloaded showcase projects copied from the reference screenshot. It starts empty and prompts you to build something original. A remix creates a separate project and instructs the coding agent to take only high-level inspiration rather than copying another creator's code, layout, graphics, text, or exact mechanics.

## Notes

ChatGPT-plan access depends on account eligibility, available models, usage limits, and approval of the plan-use consent. The local runtime requires a supported account and OS credential storage. Generated code can contain bugs; review it and its external dependencies before exporting or publishing. The official OpenAI DevKit is noncommercial-licensed; review its terms before adapting this integration for commercial use.
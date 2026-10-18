# PromptSim

A lightweight, WebSim-inspired discovery gallery for prompt-built projects.

## Open the website

**Live website:** https://cartermmoore-create.github.io/PromptSim/

GitHub Actions automatically publishes the static site to GitHub Pages whenever changes are pushed to `main`. On the first deployment, GitHub may take a few minutes to publish it. Check the repository's **Actions** tab for the deployment status.

## Features
- Purple galaxy UI using the supplied orb logo
- Four interactive local agent playgrounds: Cosmos Builder, Code Pilot, Art Director, and QA Scout
- Creator handles kept visible for the six reference projects
- Credited remix flow starts a separate project with a fresh prompt; it does not overwrite the source
- Clear local-only ownership notes; projects are saved in browser storage and are not uploaded
- Dark responsive discovery UI with top search, category filters, and a right-side navigation rail
- Project cards with illustrated SVG thumbnail art, creators, views, and likes
- Search by project name, creator, prompt, or category
- Create a project from a prompt and save it in the visitor's browser
- Preview projects and create credited remixes using a fresh prompt
- Responsive layout for desktop and mobile

## Run locally
Open `index.html` in your browser. No build step or dependencies are required.

## Important note
This is a static frontend starter. Creating a project currently saves its title and prompt in the visitor's browser; it does not generate a working game or website from the prompt, and projects do not sync between users. The agent panels are interactive local demos that return structured starter checklists; they do not call an AI model. Real AI generation needs a secure backend/API integration. Shared projects require a backend and explicit publishing controls.

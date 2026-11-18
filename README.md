# FoundYou

FoundYou is a campus lost and found. Students who lost something describe it to an AI agent, which searches the items finders have reported. Finders upload a photo, and the app identifies the item and saves it as a report.

**Live site:** https://foundyou-ui-dwrwiiioqq-ue.a.run.app

## How it fits together

| Folder | What it is | Local port |
| --- | --- | --- |
| [`ui/`](ui/README.md) | The website (React, TypeScript, Vite) | 5174 |
| `server/` | The agent: chats with the user and searches found items | 8787 |
| `image-recognition/` | The photo reader: turns a finder's photo into a structured found item | 8790 |
| `app/` | A bare local test page for the agent | — |
| `prompts/` | The agent's system prompt | — |
| `stubs/` | Fake found items used for testing | — |
| `docs/` | Tool contract, deployment notes and other project docs | — |

The website calls relative paths like `/api/chat`. On a laptop, the Vite dev server forwards them to the agent and the photo reader; online, nginx does the same.

## Run it locally

You need Node.js with npm.

1. Copy `.env.example` to `.env` in the repo root. With `MOCK_MODE=true` (the default), the agent uses scripted replies and needs no API key. Reading photos always needs an `OPENROUTER_API_KEY`; to use the real AI in the agent too, add the key and set `MOCK_MODE=false`.
2. In three terminals, install and start each service:

   ```bash
   cd server && npm install && npm run dev
   ```

   ```bash
   cd image-recognition && npm install && npm run dev
   ```

   ```bash
   cd ui && npm install && npm run dev
   ```

3. Open http://localhost:5174.

Never commit `.env`; it is already in `.gitignore`.

## Deployment

Every push to `main` deploys all three services to Google Cloud Run automatically, about 5 minutes later. See [`docs/deployment.md`](docs/deployment.md) for the details.

## Working on the project

- Work on a branch, and merge into `main` with a pull request. Merging to `main` puts changes on the live site.
- Pull `main` before you start, so you are working on the latest code.

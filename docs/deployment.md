# Deployment (Google Cloud)

**Owner:** Selena · **GCP project:** `lostnfound-370` · **Region:** `us-east1`

## What's online

| Service | Folder | URL |
|---|---|---|
| Website | `ui/` | https://foundyou-ui-dwrwiiioqq-ue.a.run.app |
| Agent | `server/` | https://foundyou-agent-dwrwiiioqq-ue.a.run.app |
| Photo reader | `image-recognition/` | https://foundyou-images-dwrwiiioqq-ue.a.run.app |

All three run on **Cloud Run**: Google runs our containers and gives each one a URL. When nobody uses a
service, it scales to zero and costs nothing.

## One URL for everything

Use the **website URL** for everything. Its nginx (`ui/nginx.conf`) forwards these paths to the other two
services, so the frontend calls relative paths like `fetch("/api/chat")` and needs no CORS:

| Path on the website URL | Goes to |
|---|---|
| `/api/chat` | Agent |
| `/api/items`, `/api/items/:id`, `/images/...` | Photo reader |
| `/api/agent/health`, `/api/images/health` | each service's `/api/health` |
| everything else | the website |

On laptops, `npm run dev` in `ui/` does the same forwarding (`ui/vite.config.ts`) to the agent on port 8787
and the photo reader on 8790. The direct service URLs above still work, for testing.

## How a deploy works

`cloudbuild.yaml` (repo root) does everything in one run:

1. Builds 3 containers, one per folder, from each folder's `Dockerfile`.
2. Stores them in **Artifact Registry** (`us-east1-docker.pkg.dev/lostnfound-370/foundyou`).
3. Deploys the photo reader, then the agent (it needs the photo reader's URL), then the website
   (it needs both URLs to forward requests).

To deploy by hand (needs access to the GCP project), from the repo root:

```sh
gcloud builds submit --config cloudbuild.yaml
```

About 3 minutes. Auto-deploy on every merge to `main` is coming next; it runs this same file.

## Settings on the cloud

| Service | Setting | Value |
|---|---|---|
| Photo reader | `GCS_BUCKET` | `lostnfound-370-images`: photos and `items.json` are saved in this private bucket, because Cloud Run's disk is wiped on every restart |
| Photo reader | `OPENROUTER_API_KEY` | read from **Secret Manager** (`openrouter-api-key`), never from a file |
| Agent | `MOCK_MODE` | `true` (no AI cost) |
| Agent | `IMAGE_BACKEND_URL` | the photo reader's URL |
| Website | `AGENT_URL`, `IMAGES_URL` | where nginx forwards `/api/*` and `/images/*` |

The services run as the service account `foundyou-run`, which can only use the bucket and read the key.

## On your laptop

Nothing changes. Without `GCS_BUCKET`, the photo reader still uses the local `image-recognition/data/` folder.

## Known limits (fine for the demo)

- The photo reader runs **max 1 instance**, because `items.json` has no locking. Move to a database behind
  `image-recognition/src/store.ts` if we need more.
- The upload endpoint and photos are public to anyone with the URL.
- The website's chat isn't connected to the agent yet. When it is, call `/api/chat` (no full URL needed).

# FoundYou: Handoff for Connecting the Assistant to Image Recognition

**Owner:** G
**For:** the teammate connecting the assistant (`server/`) to the image-recognition service (`image-recognition/`)
**Date:** 2026-10-13
**Status:** DRAFT. Read Section 3 before writing any code. Several decisions are still open.

This doc says what exists on each side, what has to change, which rules must not break, and what is still undecided.

---

## 1. Getting the code

The repo is public, so anyone can clone it: `git clone https://github.com/TBD-lostnfound/LostnFound.git`.

To push, you need one of:
- **Fork and PR:** fork on GitHub, push a branch to your fork, open a pull request to `main`.
- **Collaborator access:** G adds you under Settings, Collaborators. Then you can push branches directly.

Either way, work on a new branch, never on `main`. G reviews and merges.

---

## 2. What exists today

### Assistant side (G): `server/`, `app/`, `prompts/`, `stubs/`

| Piece | Where | Notes |
|---|---|---|
| System prompt | `prompts/foundyou-system-prompt.md` | Tells the model when and how to call the tools. |
| Agent loop | `server/src/agent.ts` | Calls OpenRouter, runs tool calls, up to 8 rounds. |
| HTTP server | `server/src/index.ts` | Port 8787. `POST /api/chat` takes `{ messages }` and returns `{ reply, toolCalls, newMessages }`. `GET /api/health`. |
| **Mock tools** | `server/src/tools.ts` | `search_items` and `get_item` over `stubs/foundyou-fake-items.json`. **This is what gets replaced.** `TOOL_DEFS` in the same file is the schema the model sees. |
| Fixed lists | `server/src/lists.ts` | Item types, colors, areas used as enums in the tool schema. |
| Test page | `app/` | Plain React page with a debug panel. Not the real UI. |
| Fake data | `stubs/` | 50 items, a check script, a generator. |
| Self-check | `cd server && npm run selfcheck` | Run before and after any change. |

Run it: `cd app && npm run dev` (server on 8787, page on http://localhost:5173). Copy `.env.example` to `.env`; keep `MOCK_MODE=true` unless you have an OpenRouter key. Never commit `.env`.

### Image-recognition side (Lucas): `image-recognition/`

| Piece | Where | Notes |
|---|---|---|
| Service | `image-recognition/src/index.ts` | Hono, port 8790 (`IMAGE_RECOGNITION_PORT`). |
| Ingest | `POST /api/items` | Multipart `photo` (max 15 MB), optional `device_lat`, `device_lng`, `device_time`. Returns the item (201). |
| Read | `GET /api/items`, `GET /api/items/:id`, `/images/*` | |
| Pipeline | `image-recognition/src/pipeline/` | EXIF or device time and GPS, nearest campus area (150 m cutoff), image normalized and stripped of EXIF, one vision-model call, postprocessing. |
| Storage | `image-recognition/src/store.ts` | JSON file plus an images folder, behind one module so it can be swapped. |
| Design doc | `docs/foundyou-image-pipeline.md` | Marked "PROPOSAL v3, nothing agreed until G and Lucas sign off." |

**Not built on that side:** search of any kind (no embeddings, no ranking), authentication, rate limiting. It only ingests and stores.

---

## 3. Decisions needed before wiring (do not guess these)

1. **Hidden details vs the full record. This blocks everything else.**
   - G's rule: the assistant never reveals a found item's hidden identifying details, including through yes/no questions. The contract has a `public` / `server_only` split so the model never sees hidden fields.
   - Lucas's proposal: no hidden fields. The agent and searcher see the full record, photo included.
   - Until G and Lucas settle this, the tool results must stay as the contract defines them (public fields only).
2. **Contract changes Lucas proposes** (his doc, Section 7): `item_type` becomes a soft boost instead of required, `keywords` becomes `description`, color-group scoring, `area` becomes a distance boost. These change the prompt, `TOOL_DEFS`, the self-check and the evals. G approves them first.
3. **Fixed lists do not match.** The contract has 25 `item_type` values and 15 colors. Lucas's service uses a 44-type taxonomy. Agree on one list, then regenerate the fake data (`python3 stubs/generate_fake_items.py`, then `python3 stubs/check_fake_items.py`).
4. **Open product questions** (Lucas's D1 to D4): camera only or gallery upload; who marks an item resolved; whether lost reports are saved and users notified; how long items stay listed.

---

## 4. Connection steps (once Section 3 is settled)

1. **Build search** over the real items. Today's service has none. Whoever builds it must match the contract: up to 5 summaries (`id`, `item_type`, `colors`, `area`, `date`) in ranking order, only `available` items.
2. **Replace the mock tools.** In `server/src/tools.ts`, make `search_items` and `get_item` read from the real service instead of `stubs/foundyou-fake-items.json`. Keep the function names, the input fields and the output shape, so `agent.ts`, the prompt and `TOOL_DEFS` need no change.
3. **Map the real record to the contract record** (Section 3 of `docs/foundyou-tool-contract.md`). Drop everything in `server_only` (`finder_id`, `detected_text`, `status`) before the result reaches the model. Return `image_url` only from `get_item`.
4. **Keep the lists in sync.** `server/src/lists.ts` and the service's lists must be identical (item types, colors, campus areas).
5. **Time zones.** `found_at` is UTC in the contract. Lucas's examples use `-04:00`. Normalize to UTC at the boundary.
6. **Run the checks:** `cd server && npm run selfcheck` and `npm run typecheck`, then a manual chat in `app/` against the real data.
7. **Real UI.** The front end lives in `ui/` on the `UI/agent-page` branch. Its chat page has a marked spot (`handleSend` in `ui/src/agentPage.tsx`) for a call to `POST /api/chat`. That wiring is a separate task; agree it with the UI owners.

---

## 5. Rules that must not break

These come from `docs/foundyou-plan-decisions.md` (source of truth) and the prompt.

- The assistant never tells a user an item is theirs. A person always confirms matches.
- It never reveals a found item's hidden identifying details, including through yes/no questions. Narrowing questions are open-ended.
- It never exposes the finder's contact details. `finder_id` stays on the server. Messages go through the anonymous inbox, and the Message button is not a tool.
- Card numbers, ID numbers and similar are never stored.
- No secrets in any file. `OPENROUTER_API_KEY` lives only in `.env`, which is gitignored.
- The browser never gets `server_only` fields or an API key.
- Do not change the system prompt wording. G owns it.

## 6. Risks to watch

- **GPS:** browsers often strip location from gallery photos. Test on one iPhone and one Android.
- **No auth or rate limiting** on the image service. Fine for a demo, not for deployment.
- **Storage:** the JSON-file store is demo-grade.
- **Prompt version:** the code uses vision prompt `v2` while Lucas's doc shows `v1`. Update the doc.

## 7. Open questions for G

- Which side builds the search, and in which service?
- Who owns the shared lists once they are agreed?
- Is the backend staying TypeScript (FOU-5 says FastAPI)?

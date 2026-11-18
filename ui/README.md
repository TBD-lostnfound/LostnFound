# Website UI

This folder contains the FoundYou website UI, built with React, TypeScript, and Vite. Icons come from `lucide-react`.

- `src/HomePage.tsx` — homepage component.
- `src/lostItemCategory.tsx` — lost item category page.
- `src/agentPage.tsx` — agent chat page.
- `src/main.tsx` — React entry point; renders the page based on the URL pathname.
- `src/globals.css` — the shared "Daylight" design: colors and font as CSS variables (`--fy-…`), the shared header, logo, back link, progress bar and buttons (`fy-…` classes), and the shared animations.
- `src/HomePage.css` — homepage styling.
- `src/SiteHeader.tsx` — logo and main navigation shared by the homepage and About page.
- `src/AboutPage.tsx` / `src/AboutPage.css` — About page and its styling.
- `src/reportItem.tsx` / `src/reportItem.css` — found item form and its styling.
- `src/lostItemCategory.css` — lost item category page styling.
- `src/agentPage.css` — agent chat page styling. Its class names all start with `agent-` so they don't affect the other pages.

Pages and navigation:

| URL | Component | Purpose |
| --- | --- | --- |
| `/` | `HomePage` | Homepage with the two report buttons and a How it works section for both the lost and found flows. |
| `/about` | `AboutPage` | What FoundYou is, the problem it solves (including waste from unclaimed items), what makes it different, and trust and safety. Each waste figure links to its source. Send feedback is not connected yet. |
| `/found/report` | `ReportItem` | Found item photo and details form. |
| `/lost/category` | `LostItemCategory` | First step of the lost item flow, showing six item categories. |
| `/lost/agent` | `AgentPage` | Chat with the FoundYou agent to describe the lost item and see possible matches. |

The pages use the Plus Jakarta Sans font, loaded from Google Fonts in `index.html`. Orange buttons always use dark text so they stay readable. All animations turn off when the device has reduce motion enabled.

Clicking **I Lost Something** on the homepage navigates to `/lost/category`. **See how it works** scrolls to the How it works section. You can also open that URL directly. Navigation currently uses `window.location.assign`, and `main.tsx` chooses the component without a routing library. Other paths currently render the homepage.

The category page displays Bookbag, Laptop & Technology, Water Bottle, Clothes & Apparel, ID, Wallet & Lanyards, and Keys & Accessories. Bookbag is currently selected by default. Click a card to select it; Continue opens the agent page at `/lost/agent` with that category. Back to home and Go Back return to the homepage, and the FoundYou logo on every page links to the homepage. **About** in the navigation opens `/about`. Sign In still has a placeholder handler. **I Found Something** opens `/found/report`. The found item form supports photo previews, category selection, location, and optional details. Colors use the fixed `colors` list from `docs/foundyou-tool-contract.md`: finders can pick several swatches, pick an exact shade (mapped to the closest listed color), or describe the color in words (for example, navy maps to blue). The date defaults to today, with Today and Yesterday shortcuts, a date picker for the last 90 days, and an optional time. Submit sends the photo and a validated JSON `report` field as multipart data to `/api/items`, then shows the saved reference. The button is disabled while uploading and after success; a failed request keeps the form available for retry. A missing time stays date-only. Finder-entered category/details are retained under `finder_report`; the AI supplies the detailed item type. Explicit campus names such as `Woodruff Library` or `Woodruff Library, 2nd floor` map to a campus area; other text is retained without guessing an area.

The agent page opens on an empty chat and sends messages to `/api/chat`, preserving the assistant/tool history between turns. The sidebar shows the selected category and the colors/area from the latest actual search; an omitted area is shown as "All campus areas". Match cards come from `get_item` tool results. Clicking one opens a native dialog with its photo, description, recorded location/date, brand, and reference. "Review matches shown in this chat" opens the distinct items already returned in the conversation, rather than claiming to browse the whole inventory. Escape or Close dismisses the dialog. Photos use the website's `/images/` proxy. Back returns to the category page. FoundYou suggests candidates and does not determine ownership.

Install Node.js with npm, then run these commands from the repository root:

```sh
cd ui
npm install
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5174).

Keep the development server running while editing the UI. Saved changes appear automatically in the browser. Press Control + C to stop the server. `npm install` installs all listed dependencies, including `lucide-react`.

Run `npm run build` to typecheck and create a production build.

Run `npm run preview` after building to preview the production build locally. When hosting the UI, configure the host to serve `index.html` for page routes such as `/lost/category` so direct visits and refreshes work.

The older React application lives in `../app/`; `ui/` is the website used by the current deployment.

Checks from the repository root:

```sh
npm --prefix ui run build
npm --prefix server run typecheck
npm --prefix server run selfcheck
npm --prefix image-recognition run typecheck
npm --prefix image-recognition run selfcheck
```

Both selfchecks use fake responses; the report-flow check also uses temporary storage and performs no paid AI requests. For a manual smoke test, start all three services, submit a sample photo with a known campus location and no time, check that the form shows a reference, search for it in chat, and open its match card. Check retry behavior with the image service stopped. Sign-in, claim confirmation, and notifications remain separate work; use sample photos because access controls are not implemented yet.

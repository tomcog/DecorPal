# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on **port 5180** (`strictPort: true` — fails if taken; do not change).
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the built bundle.
- `npm run lint` — ESLint over the repo (flat config in `eslint.config.js`).

No test runner is configured.

## Environment

`.env` (copy from `.env.example`) must define:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase client (`src/lib/supabase.js`). Missing creds make `supabase` export `null`; hooks short-circuit rather than throw.
- `VITE_GOOGLE_API_KEY` — used **client-side** by `generateVisualization` in `src/hooks/useStudio.js` to call Gemini directly from the browser. The key is shipped to clients; treat any production deployment as exposing it.

The `supabase/functions/generate-render` Edge Function is a server-side alternative that calls Anthropic (`ANTHROPIC_API_KEY`), but the live AI Studio UI does **not** route through it — it calls Gemini directly. If consolidating, decide which path is canonical before editing.

## Architecture

**Stack:** React 19 + Vite 8 + React Router 7, Supabase (auth + Postgres + Storage), `vite-plugin-pwa` for installable PWA. No TypeScript.

**Routing (`src/App.jsx`):** A single `<ProtectedRoute><AppLayout/></ProtectedRoute>` wraps every authed route; `/login` is the only public route. `AppLayout` provides the sidebar (Spaces / AI Studio / Images) and renders `<Outlet/>`. Nested routes are organized around a Space: `spaces/:id/{items,palettes,paints,lighting,renders}/...`.

**Providers (outer → inner in `App.jsx`):** `ThemeProvider` (dark/light, persisted in `localStorage` under `decorpal-theme`; the initial value is set by an inline script in `index.html` to avoid FOUC) → `AuthProvider` (Supabase session) → `BrowserRouter`.

**Data layer — hooks per resource (`src/hooks/use*.js`):** Each resource (`useSpaces`, `useItems`, `usePalettes`, `usePaints`, `useLightingIdeas`, `useRenders`) owns its own Supabase queries, in-memory list state, and CRUD helpers. There is **no shared cache layer** (no React Query/SWR) — list pages call the hook, detail/form pages re-fetch. When adding a resource, follow this same pattern; don't introduce a global store for one feature.

**Database (`supabase/migrations/`):** Tables `spaces`, `furnishing_items`, `palettes`, `paints`, `lighting_ideas`, `lighting_products`, `renders`. Every table is `user_id`-scoped with RLS policies of the form `auth.uid() = user_id` for select/insert/update/delete. New tables must follow the same RLS pattern. Storage buckets exist per asset type: `space-covers`, `item-photos`, `lighting-photos`, `renders` — each created in its own migration.

**AI Studio (`src/pages/AIStudioPage.jsx` + `src/hooks/useStudio.js`):** The flagship feature. The composer combines free text + "attachments" (palettes/items/lighting/renders pulled from existing spaces via `AssetPicker`) + uploaded photo files. `generateVisualization` flattens attachments into prompt lines, base64-encodes photos, and POSTs to Gemini `gemini-2.5-flash-image:generateContent` with `responseModalities: ['IMAGE','TEXT']`. The returned image is held as a data URL until the user saves; `uploadRenderImage` then pushes the blob to the `renders` bucket and `saveRender` inserts a row with `prompt_text` + `prompt_metadata` so the prompt history is recoverable. The page installs a `beforeunload` + `popstate` guard while an unsaved generation exists — preserve this when editing.

**Space detail tabs (`src/pages/SpaceDetailPage.jsx`):** The space view has six tabs — `Feed`, `Images`, `Items`, `Palette`, `Paint`, `Lighting` — rendered by dedicated components in `src/components/`. Active tab is persisted to `sessionStorage` under the key `space-tab-<spaceId>` so navigation away and back restores position. Tab components are mounted/unmounted on switch (no keep-alive).

**Color extraction (`src/lib/colorExtractor.js`):** Two exports. `extractColorsFromImageUrl(url, count)` runs a median-cut quantization over a 64×64 canvas sample and returns up to `count` deduplicated hex strings sorted by luminance — used when creating an image-based palette. `pickColorFromCanvas(canvas, x, y)` reads a single pixel — used by the eyedropper in the palette color picker.

**`useStudio.js` dual role:** In addition to the AI Studio generation logic, this file exports `useAllSpacesWithAssets()` — a hook that fetches all spaces plus items/palettes/lighting/renders in one parallel `Promise.all` and joins them client-side. This is what `AssetPicker` uses to populate attachment options; it is **not** a per-resource hook like the others.

**Styling:** Plain CSS files per feature in `src/styles/`, imported directly by the component that owns the view. Theme is driven by a `data-theme` attribute on `<html>`; CSS variables key off it. Design tokens (spacing, radius, type scale, transitions, layout dimensions) live in `src/styles/tokens.css`. No CSS-in-JS, no Tailwind.

**PWA:** `vite-plugin-pwa` with `registerType: 'autoUpdate'`. Manifest lives in `vite.config.js`; icons in `public/`.

# The Self-Sealing Tower + City — playable PWA

A two-part 3D browser game based on **corrigibility as routed correction**. The original tower preserves its ten-floor systems story. The new city adds a deterministic civic campaign, people and institutions with partial knowledge, correction-route ecology, research archives, scenario tools, optional OpenAI-compatible narration, and an optional SpacetimeDB shared-world backend.

**Play online:** https://princejonaa.github.io/self-sealing-city/

## What is implemented

- Procedural Three.js tower with ten authored discrepancy floors
- Three consequential choices per floor and five structurally computed endings
- Live variables for performance, route access, stability, correction debt, φ, θ, audit memory, dissent, channel independence, and review capacity
- Clickable floor archive and X-ray view of correction cores and slow coordinates
- Optional procedural sound, haptics, wake lock, autosave, resume, undo, and shareable ending text
- Adaptive 3D quality for lower-power phones and high-resolution devices
- Story-mode fallback when WebGL2 is unavailable
- A second playable entry point at `city.html` with 3 districts, 8 institutions, 30 citizens, 5 cases, and three viewpoints
- Offline authored narration plus Ollama, LM Studio, OpenAI, and custom OpenAI-compatible provider presets
- Validated scenario authoring, plural archive, research JSON/CSV, and an independently compiling SpacetimeDB module

## Mobile design pass

### Portrait

- Safe-area-aware full-screen layout for notched phones
- Bottom decision sheet with expand, collapse, minimize, and swipe gestures
- Persistent horizontal decision rail on narrow phones, so a response is always reachable without scrolling through the whole event first
- Touch-first HUD, History, X-ray, Focus, and Settings dock
- Larger choice targets and confirmation before architecture-changing actions

### Landscape

- Split-screen mode: maximum-height 3D scene on the left and a scrollable decision surface on the right
- Compact vertical HUD and no bottom dock competing with the scene
- Shorter decision cards while full details remain available through confirmation

### PWA and continuity

- Installable manifest with maskable and Apple touch icons
- Offline app shell and runtime asset caching
- Standalone display mode in either orientation
- Autosave and resume after reload, app backgrounding, or accidental closure
- Online/offline state indicator and install guidance for iOS/Android
- Pauses animation and audio while backgrounded to reduce battery use

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

Use `city.html` for the city campaign or `index.html` for the tower.

## Production build

```bash
npm run build:standalone
npm run preview
```

The deployable PWA is generated in `dist/`. Pushes to `main` are verified and published automatically through GitHub Pages.

## Controls

- Drag: orbit the camera
- Pinch or wheel: zoom
- Tap a floor: inspect that decision
- Focus: return to the newest floor
- X-ray: expose slow coordinates and vertical correction cores
- Portrait sheet: swipe the handle up or down to change its state
- Narrow portrait: swipe the decision rail sideways to compare responses

## Deliverables

- `dist/`: deployable installable PWA
- `standalone-mobile.html`: one-file tower version
- `standalone-city.html`: one-file city version
- `CITY_DEVELOPMENT_PLAN.md`: delivered five-phase plan and acceptance gates
- `OPENAI_COMPATIBLE_PROVIDERS.md`: Ollama, LM Studio, OpenAI, and custom setup
- `MULTIPLAYER_DEPLOYMENT.md`: generated bindings and publish boundary
- `ACCEPTANCE_EVIDENCE.md`: automated and browser QA record
- `MOBILE_DESIGN_RUN.md`: design rationale and verification record
- `SCENARIO_AUTHORING.md`: guide for adding scenario floors

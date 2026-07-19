# Mobile Design Run

## Design goal

Preserve the 3D tower as the emotional center while making every consequential action reachable with one hand in portrait and without sacrificing scene height in landscape.

## Primary problems addressed

1. Desktop panels consumed too much of a phone viewport.
2. Narrative copy could place the choices below the initial portrait fold.
3. Device notches, browser bars, and home indicators could cover controls.
4. High device-pixel ratios and continuous animation could waste battery.
5. Reloading or backgrounding could destroy an unfinished run.
6. A one-file demo could not provide a true installable/offline PWA.

## Resulting interaction model

### Portrait phone

The 3D scene remains behind a snap-style bottom sheet. The player can expand, peek, or minimize it by button or vertical swipe. On screens up to 430 CSS pixels wide, choices become a persistent horizontal rail pinned inside the sheet. Each compact card exposes its action, type, and major variable effects; tapping opens the full explanation and confirmation.

### Landscape phone

The screen becomes a split game surface. The tower owns the left side, while the event and responses occupy a bounded right panel. The HUD stacks vertically and the bottom dock disappears, preserving vertical 3D space.

### Tablet and desktop

Tablets retain the mobile sheet and larger full-description cards. Desktop keeps the three-column decision comparison, detailed metrics, and persistent structural archive.

## Performance tiers

- **Auto:** selects low detail on touch devices, low-memory devices, or low-core-count devices.
- **Low:** lower render pixel ratio, fewer background stars, fewer geometry segments, no shadows.
- **High:** higher render pixel ratio, denser background, smoother geometry, shadows enabled.

Animation, audio, and wake lock stop when the document is hidden. Reduced-motion preferences are honored and can be overridden in Settings.

## PWA behavior

- Manifest supports standalone launch in portrait or landscape.
- Install icons include standard, maskable, and Apple touch formats.
- The service worker discovers and pre-caches the current hashed Vite assets from `index.html`, then runtime-caches same-origin resources.
- Navigation falls back to the cached app shell when offline.
- Game state and settings persist locally.

## Accessibility and recovery

- Native buttons, selects, checkboxes, and dialogs preserve keyboard and assistive-technology behavior.
- Touch targets are enlarged and accidental choices can require confirmation.
- Story mode preserves the full game loop when WebGL2 is unavailable.
- Undo removes the newest floor and reconstructs the prior tower state.

## Verification matrix

The production bundle was exercised at:

- 390 × 844 phone portrait
- 844 × 390 phone landscape
- 820 × 1180 tablet portrait
- 1440 × 900 desktop

The scripted test opened the game, entered story mode in the GPU-limited test browser, started a run, closed the tutorial, selected and confirmed a decision, and verified the floor/history update without console or page errors. The narrow portrait test additionally confirmed that the first choice card is visible on initial event load.

The sandbox browser does not expose WebGL2, so the actual GPU-rendered tower should receive a final visual check on physical iOS and Android hardware. The Three.js production bundle compiles successfully and the non-GPU game path is fully exercised.

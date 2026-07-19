# Acceptance evidence

## Automated gates

- `npm run typecheck`
- `npm run typecheck:spacetime`
- `npm test`
- `npm run build:standalone`

The test suite covers deterministic replay, seeded variation, versioned saves, correction-route blockage, narration independence, campaign advancement/completion, citizen memories, multi-perspective archive generation, scenario validation, OpenAI-compatible endpoints/API keys/fact boundaries, and the shared-city adapter contract.

## Browser matrix

| View | Acceptance check |
|---|---|
| Desktop 1440×900 | City scene visible beside a dedicated workspace; intervention changes metrics and opens the archive; all three viewpoints and tool modals are reachable. |
| Phone portrait 390×844 | Full-width bottom workspace above the persistent horizontal intervention rail; page width remains 390 px; tabs and rail scroll locally. |
| Phone landscape 844×390 | 3D scene on the left, workspace on the right, intervention rail on the lower-left; no document overflow. |

Additional checks: authored partial-knowledge dialogue, local shared-flow preview, scenario tool dialog, AI presets, autosave containing the authoritative event and five citizen memories, and an empty browser error/warning console after interaction.

Production-preview evidence:

- City Lighthouse: Accessibility 100, Best Practices 100, SEO 100, Agentic Browsing 100; 48 passed, 0 failed.
- Tower Lighthouse: Accessibility 100, Best Practices 100, SEO 100, Agentic Browsing 100; 50 passed, 0 failed.
- Desktop city trace on the local production preview: LCP 172 ms and CLS 0.00.
- The installed service worker activated, cached both HTML entry points and their hashed assets, and reloaded `city.html` successfully while the browser was offline.
- Tower desktop panel was measured fully inside the viewport in floating mode with native two-axis resize enabled; left and right dock modes reduced and shifted the canvas so the panel did not cover the 3D scene.

## Honest deployment boundary

The source contains and independently typechecks the full SpacetimeDB module, but this static release does not claim a live hosted database. Publishing requires a SpacetimeDB target and generated bindings as described in `MULTIPLAYER_DEPLOYMENT.md`. OpenAI-compatible narration likewise requires a provider chosen by the player; the offline game is complete without it.

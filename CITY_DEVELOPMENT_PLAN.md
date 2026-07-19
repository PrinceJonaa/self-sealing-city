# The Self-Sealing City — five-phase delivery plan

This release turns the tower into a reusable city foundation while keeping the original game playable. The simulation owns factual reality; authored or model-generated text only interprets permitted facts.

## Phase 0 — deterministic foundation

Delivered:

- Versioned TypeScript world schema for districts, buildings, citizens, relationships, facts, memories, correction routes, crises, viewpoints, authority, events, and commands.
- Seeded world generation and pure `advanceWorld`/`replayWorld` functions.
- Autosave, schema validation, replay tests, route-reachability tests, and narrative-independence tests.

Acceptance: an identical seed and command log produces an identical authoritative snapshot, and narration cannot alter metrics or crisis state.

## Phase 1 — playable city block

Delivered:

- Procedural Three.js city with 3 districts, 8 institutions, 30 citizens, 5 named citizens, and a visible correction-route ecology.
- Three prepared scales: limited civic steward, embodied Mara, and hospital/institution desk.
- Eight interventions whose effects include performance, trust, dissent, review capacity, memory, route access, and correction debt.

Acceptance: a discrepancy can be inspected at city, institution, and person scale; player action changes the city without directly puppeting every citizen.

## Phase 2 — commercial vertical slice

Delivered:

- A coherent pressure-network case, route graph, public decision, partial-knowledge dialogue, institutional trade-offs, autosave, offline authored narration, and optional provider-neutral narration.
- Native desktop side workspace plus portrait bottom workspace and landscape split view.
- PWA app shell and single-file city/tower builds.

Acceptance: the pressure case is playable end-to-end with no external service; optional narrative failure falls back without changing factual outcomes.

## Phase 3 — solo campaign, authoring, and research

Delivered:

- Five-case campaign spanning utilities, hospital medication, transit, archives, courts, school, press, and public rumor.
- Multi-perspective city archive: official history, dissident record, causal record, route map, biographies, and unresolved questions.
- Validated JSON scenario import/export plus downloadable research JSON and event CSV.

Acceptance: all cases can be closed without wrapping silently; a campaign ending and portable evidence record remain available.

## Phase 4 — persistent shared city and narrative services

Delivered:

- SpacetimeDB TypeScript module with persistent city/citizen/building/relationship/knowledge/memory/route/event/proposal/vote/player/intervention/job tables.
- Atomic join, intervention, proposal, vote, narrative-job, disconnect, and scheduled-tick reducers.
- Frontend authority adapter, connection UI, three shared roles, and a local contract preview for offline development.
- OpenAI-compatible narrative interface with Ollama, LM Studio, OpenAI, and custom presets, optional key, endpoint testing, timeouts, strict schema parsing, fact-boundary validation, and authored fallback.

Acceptance: the backend compiles independently; the client authority boundary is tested; all provider presets use standard `/v1/models` and `/v1/chat/completions` semantics. A live shared city still requires publishing the included module and generating bindings for the chosen deployment.

## Phase 5 — expansion path

The durable expansion lane is content and polish, not a rewrite: more scenario packs, denser citizen schedules, richer building interiors, deployed multiplayer seasons, localization, controller support, and commercial art/audio can extend the tested authority and simulation boundaries in this release.

Release gates: typecheck, backend typecheck, deterministic tests, production and standalone builds, desktop browser interaction, portrait and landscape layout checks, no console errors, save/reload, fallback behavior, and PWA/offline inspection.

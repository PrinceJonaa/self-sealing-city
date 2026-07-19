# Self-Sealing City SpacetimeDB module

This module is the optional authoritative multiplayer backend. The solo game does not require it.

It defines persistent city, citizen, institution, knowledge, memory, correction-route, proposal, vote, intervention, narrative-job, and authoritative event tables. Reducers validate player membership and apply interventions atomically. A scheduled reducer advances the coarse city clock every five seconds.

Generate browser bindings and publish with a matching SpacetimeDB CLI/SDK version:

```bash
spacetime generate --lang typescript --out-dir ../src/multiplayer/module_bindings --module-path .
spacetime publish self-sealing-city --module-path .
```

The frontend keeps the local deterministic authority as its default and loads generated bindings only when multiplayer is configured.

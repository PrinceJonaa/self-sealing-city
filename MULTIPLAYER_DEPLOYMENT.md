# Shared-city deployment

Solo play and the local shared-flow preview need no server. Persistent multiplayer uses the module in `spacetime/`.

With a SpacetimeDB CLI matching the `spacetimedb` package version:

```bash
cd spacetime
spacetime generate --lang typescript --out-dir ../src/multiplayer/module_bindings --module-path .
spacetime publish self-sealing-city --module-path .
```

Create an adapter around the generated `DbConnection` that implements `SpacetimeBindingsAdapter` from `src/multiplayer/authority.ts`, then assign that adapter before the React application mounts:

```ts
window.__SELF_SEALING_SPACETIME_ADAPTER__ = adapter;
```

The adapter maps:

- `connect` to the generated connection builder and subscriptions;
- `joinCity` to `reducers.joinCity`;
- `submitIntervention` to `reducers.submitIntervention`;
- `subscribe` to connection/player/city table updates.

The module keeps narrative generation asynchronous through `narrativeJob`; reducers do not call a model or trust generated prose as world truth.

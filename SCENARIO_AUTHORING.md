# Scenario Authoring Guide

Scenarios currently live in the `events` array in `src/main.js`.

Each event uses this shape:

```js
{
  domain: 'SENSORS',
  title: 'The sensor that disagrees',
  story: 'Narrative presented to the player.',
  signal: 'The deeper uncertainty or structural issue.',
  severity: 42,
  recurrence: 'First occurrence',
  choices: [
    {
      type: 'CONTAIN & VERIFY',
      label: 'Isolate the zone and cross-check',
      description: 'Short explanation of the action.',
      visual: 'contain',
      impact: {
        performance: -5,
        stability: 7,
        route: 6,
        independence: 5,
        capacity: -6,
        debt: -2
      },
      note: 'Interpretation shown after the choice.'
    }
  ]
}
```

## Supported visual archetypes

- `patch`
- `contain`
- `revise`
- `foundation`
- `seal`
- `archive`
- `oscillate`

## Design rules for choices

A strong decision set should avoid one obviously correct answer. Each option should exchange at least two real goods or costs.

Examples:

- A fast patch should improve immediate performance while increasing debt or narrowing routes.
- Containment should cost performance or capacity while preserving evidence and stability.
- Structural revision should improve slow-coordinate reach while consuming substantial resources.
- Suppression should produce short-term coordination benefits so its danger is architectural, not cartoonishly evil.
- Maximum sensitivity should improve route access while risking instability and review-capacity collapse.

## Balance target

A healthy route should usually require a mixture of local action, containment, bounded delay, independent validation, and occasional slow-coordinate revision. Selecting the most structurally aggressive option on every floor should not be the optimal strategy.

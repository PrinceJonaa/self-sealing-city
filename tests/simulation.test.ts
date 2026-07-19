import { describe, expect, it } from 'vitest';
import { advanceWorld, replayWorld, routeReachability } from '../src/simulation/engine';
import { parseCitySave, serializeCitySave } from '../src/simulation/persistence';
import { createInitialWorld } from '../src/simulation/seed';
import type { WorldCommand } from '../src/simulation/types';

const commands: WorldCommand[] = [
  { id: 'c1', type: 'intervene', kind: 'protect_engineer', targetId: 'citizen-1' },
  { id: 'c2', type: 'tick', ticks: 12 },
  { id: 'c3', type: 'intervene', kind: 'fund_investigation', targetId: 'waterworks' },
];

describe('deterministic city simulation', () => {
  it('replays an identical authoritative snapshot from the same seed and commands', () => {
    const first = advanceWorld(createInitialWorld(418), commands).snapshot;
    const replay = replayWorld(createInitialWorld(418), commands);
    expect(replay).toEqual(first);
  });

  it('produces different citizens from different seeds without changing the schema', () => {
    const first = createInitialWorld(418);
    const second = createInitialWorld(419);
    expect(first.schemaVersion).toBe(second.schemaVersion);
    expect(first.citizens.map((citizen) => citizen.position)).not.toEqual(second.citizens.map((citizen) => citizen.position));
  });

  it('preserves and restores a versioned save', () => {
    const snapshot = advanceWorld(createInitialWorld(), commands).snapshot;
    const restored = parseCitySave(serializeCitySave(snapshot));
    expect(restored.snapshot).toEqual(snapshot);
    expect(restored.commands).toEqual(commands);
  });

  it('computes a complete correction route and reflects blocked detection', () => {
    const initial = createInitialWorld();
    expect(routeReachability(initial).path).toEqual(['sensor', 'engineering-review', 'clinical-impact', 'hospital-escalation', 'executive-decision', 'audit-record']);
    const sealed = advanceWorld(initial, [{ id: 'threshold', type: 'intervene', kind: 'raise_threshold' }]).snapshot;
    expect(routeReachability(sealed).score).toBeLessThan(routeReachability(initial).score);
  });

  it('keeps factual outcomes independent from any narrative provider', () => {
    const withoutNarrative = advanceWorld(createInitialWorld(), commands).snapshot;
    const withNarrativeMetadata = { ...withoutNarrative, eventLog: withoutNarrative.eventLog.map((event) => ({ ...event, title: event.title })) };
    expect(withNarrativeMetadata.metrics).toEqual(withoutNarrative.metrics);
    expect(withNarrativeMetadata.crisis).toEqual(withoutNarrative.crisis);
  });

  it('advances a multi-case campaign while preserving prior authoritative history', () => {
    const initial = createInitialWorld();
    const acted = advanceWorld(initial, [{ id: 'protect', type: 'intervene', kind: 'protect_engineer' }]).snapshot;
    const advanced = advanceWorld(acted, [{ id: 'next', type: 'advance_crisis' }]).snapshot;
    expect(advanced.activeCrisisIndex).toBe(1);
    expect(advanced.crisis.id).toBe('medication-crisis');
    expect(advanced.eventLog).toHaveLength(2);
  });

  it('finishes the campaign without silently wrapping to the first case', () => {
    let world = createInitialWorld();
    for (let index = 0; index < world.crisisDeck.length; index += 1) {
      world = advanceWorld(world, [
        { id: `act-${index}`, type: 'intervene', kind: 'contain_system' },
        { id: `advance-${index}`, type: 'advance_crisis' },
      ]).snapshot;
    }
    expect(world.activeCrisisIndex).toBe(world.crisisDeck.length - 1);
    expect(world.crisisDeck.every((crisis) => crisis.stage === 'resolved' || crisis.stage === 'failed')).toBe(true);
  });

  it('turns consequential choices into citizen memories without changing the event truth', () => {
    const world = advanceWorld(createInitialWorld(), [{ id: 'memory-choice', type: 'intervene', kind: 'centralize_authority' }]).snapshot;
    expect(world.memories).toHaveLength(5);
    expect(world.memories[0]?.summary).toContain('centralize authority');
    expect(world.eventLog[0]?.provenance).toBe('player');
  });
});

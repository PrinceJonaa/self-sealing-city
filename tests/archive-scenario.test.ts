import { describe, expect, test } from 'vitest';
import { buildCityArchive, researchCsv } from '../src/archive/cityArchive';
import { scenarioFromWorld, worldFromScenario } from '../src/content/scenarioPack';
import { advanceWorld } from '../src/simulation/engine';
import { createInitialWorld } from '../src/simulation/seed';

describe('city archive and scenario tools', () => {
  test('builds multi-perspective archive from authoritative history', () => {
    const initial = createInitialWorld();
    const world = advanceWorld(initial, [{ id: 'protect-1', type: 'intervene', kind: 'protect_engineer' }]).snapshot;
    const archive = buildCityArchive(world);
    expect(archive.officialHistory[0]).toContain('Dissent receives protection');
    expect(archive.dissidentRecord.some((line) => line.includes('Mara Vale'))).toBe(true);
    expect(archive.routeMap.path.at(-1)).toBe('audit-record');
    expect(researchCsv(world)).toContain('event_id');
  });

  test('exports and imports a validated deterministic scenario pack', () => {
    const world = createInitialWorld(99);
    const packed = scenarioFromWorld(world);
    const restored = worldFromScenario(JSON.parse(JSON.stringify(packed)));
    expect(restored.seed).toBe(99);
    expect(restored.crisisDeck).toEqual(world.crisisDeck);
    expect(() => worldFromScenario({ ...packed, format: 'unknown' })).toThrow();
  });
});

import { describe, expect, test, vi } from 'vitest';
import { SharedCityAuthority, type SpacetimeBindingsAdapter } from '../src/multiplayer/authority';

describe('shared city authority boundary', () => {
  test('connects, joins and submits through generated-binding adapter contract', async () => {
    const adapter: SpacetimeBindingsAdapter = {
      connect: vi.fn(async () => undefined),
      disconnect: vi.fn(),
      joinCity: vi.fn(async () => undefined),
      submitIntervention: vi.fn(async () => undefined),
      subscribe: vi.fn(() => () => undefined),
    };
    const authority = new SharedCityAuthority(adapter);
    await authority.connect({ uri: 'http://localhost:3000', database: 'city', displayName: 'Steward', role: 'steward' });
    await authority.intervene('publish_evidence', 'press');
    expect(adapter.connect).toHaveBeenCalledWith(expect.objectContaining({ database: 'city' }));
    expect(adapter.joinCity).toHaveBeenCalledWith('Steward', 'steward');
    expect(adapter.submitIntervention).toHaveBeenCalledWith('publish_evidence', 'press');
  });
});

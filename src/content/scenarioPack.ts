import { z } from 'zod';
import { createInitialWorld } from '../simulation/seed';
import type { WorldSnapshot } from '../simulation/types';

const crisisSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3),
  stage: z.enum(['latent', 'detected', 'contested', 'decision', 'contained', 'resolved', 'failed']),
  severity: z.number().min(0).max(100),
  recurrence: z.number().int().min(0),
  originBuildingId: z.string(),
  implicatedBuildingIds: z.array(z.string()).min(1),
  evidence: z.number().min(0).max(100),
  publicAwareness: z.number().min(0).max(100),
  pendingDecisionId: z.string().nullable(),
});

export const scenarioPackSchema = z.object({
  format: z.literal('self-sealing-city-scenario'),
  version: z.literal(1),
  title: z.string().min(3).max(100),
  author: z.string().min(1).max(100),
  description: z.string().max(500),
  seed: z.number().int().nonnegative(),
  startingMetrics: z.object({
    performance: z.number().min(0).max(100),
    routeAccess: z.number().min(0).max(100),
    stability: z.number().min(0).max(100),
    correctionDebt: z.number().min(0).max(100),
    legitimacy: z.number().min(0).max(100),
    publicTrust: z.number().min(0).max(100),
    reviewCapacity: z.number().min(0).max(100),
  }),
  crises: z.array(crisisSchema).min(1).max(20),
});

export type ScenarioPack = z.infer<typeof scenarioPackSchema>;

export function scenarioFromWorld(world: WorldSnapshot): ScenarioPack {
  return {
    format: 'self-sealing-city-scenario',
    version: 1,
    title: 'The Self-Sealing City campaign',
    author: 'City scenario editor',
    description: 'A portable scenario pack generated from the current deterministic city.',
    seed: world.seed,
    startingMetrics: world.metrics,
    crises: world.crisisDeck,
  };
}

export function worldFromScenario(input: unknown): WorldSnapshot {
  const scenario = scenarioPackSchema.parse(input);
  const base = createInitialWorld(scenario.seed);
  return { ...base, metrics: scenario.startingMetrics, crisisDeck: scenario.crises, crisis: { ...scenario.crises[0]!, stage: 'detected' }, activeCrisisIndex: 0 };
}

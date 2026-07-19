import { z } from 'zod';
import type { WorldCommand, WorldSnapshot } from './types';

export const CITY_SAVE_VERSION = 1;

const saveEnvelopeSchema = z.object({
  version: z.literal(CITY_SAVE_VERSION),
  savedAt: z.number(),
  initialSeed: z.number(),
  snapshot: z.custom<WorldSnapshot>((value) => typeof value === 'object' && value !== null && (value as WorldSnapshot).schemaVersion === 1),
  commands: z.array(z.custom<WorldCommand>((value) => typeof value === 'object' && value !== null && 'type' in value)),
});

export type CitySaveEnvelope = z.infer<typeof saveEnvelopeSchema>;

export function serializeCitySave(snapshot: WorldSnapshot): string {
  return JSON.stringify({ version: CITY_SAVE_VERSION, savedAt: Date.now(), initialSeed: snapshot.seed, snapshot, commands: snapshot.commandLog } satisfies CitySaveEnvelope);
}

export function parseCitySave(raw: string): CitySaveEnvelope {
  const value = JSON.parse(raw) as unknown;
  return saveEnvelopeSchema.parse(value);
}

export function migrateCitySave(value: unknown): CitySaveEnvelope {
  return saveEnvelopeSchema.parse(value);
}

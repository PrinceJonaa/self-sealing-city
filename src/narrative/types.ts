import { z } from 'zod';

export const narrativeResultSchema = z.object({
  private_interpretation: z.string().max(800),
  next_action: z.string().max(240),
  dialogue: z.string().max(500),
  memory_summary: z.string().max(500),
  confidence: z.number().min(0).max(1),
  referenced_fact_ids: z.array(z.string()).max(12),
});

export type NarrativeResult = z.infer<typeof narrativeResultSchema>;

export type NarrativeRequest = {
  citizen: {
    id: string;
    name: string;
    role: string;
    traits: Record<string, number>;
    goal: string;
  };
  knownFacts: Array<{ id: string; statement: string; reliability: number }>;
  recentEvents: Array<{ id: string; factualSummary: string }>;
  relationships: Array<{ citizenId: string; kind: string; trust: number }>;
  requestedForm: 'dialogue' | 'interpretation' | 'memory' | 'news';
};

export type NarrativeProviderStatus = {
  available: boolean;
  label: string;
  detail: string;
};

export interface NarrativeProvider {
  readonly id: string;
  readonly label: string;
  status(signal?: AbortSignal): Promise<NarrativeProviderStatus>;
  generate(request: NarrativeRequest, signal?: AbortSignal): Promise<NarrativeResult>;
}

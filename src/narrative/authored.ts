import type { NarrativeProvider, NarrativeProviderStatus, NarrativeRequest, NarrativeResult } from './types';

export class AuthoredNarrativeProvider implements NarrativeProvider {
  readonly id = 'authored';
  readonly label = 'Authored and procedural';

  async status(): Promise<NarrativeProviderStatus> {
    return { available: true, label: this.label, detail: 'Offline narrative is ready.' };
  }

  async generate(request: NarrativeRequest): Promise<NarrativeResult> {
    const primary = request.knownFacts[0];
    return {
      private_interpretation: primary ? `${request.citizen.name} treats “${primary.statement}” as incomplete but consequential evidence.` : `${request.citizen.name} knows the city is changing but lacks discriminating evidence.`,
      next_action: request.citizen.role === 'engineer' ? 'Preserve the anomaly record and seek an independent review.' : 'Compare the public account with trusted local observations.',
      dialogue: primary ? `I can only tell you what I saw: ${primary.statement}` : 'I have an account of what happened, but not enough to call it the cause.',
      memory_summary: `${request.citizen.name} remembers whether the city protected uncertainty or forced a premature answer.`,
      confidence: primary ? primary.reliability / 100 : 0.32,
      referenced_fact_ids: primary ? [primary.id] : [],
    };
  }
}

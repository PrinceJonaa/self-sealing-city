import { describe, expect, it } from 'vitest';
import { OpenAICompatibleNarrativeProvider, OPENAI_COMPATIBLE_PRESETS } from '../src/narrative/openai-compatible';
import type { NarrativeRequest } from '../src/narrative/types';

const request: NarrativeRequest = {
  citizen: { id: 'citizen-1', name: 'Mara Vale', role: 'engineer', traits: { caution: 0.72 }, goal: 'Prevent another rupture' },
  knownFacts: [{ id: 'fact-pressure-repeat', statement: 'The anomaly repeated three times.', reliability: 78 }],
  recentEvents: [],
  relationships: [],
  requestedForm: 'dialogue',
};

const validResult = {
  private_interpretation: 'The repetition may be structural.',
  next_action: 'Contact an inspector.',
  dialogue: 'This is the third time.',
  memory_summary: 'Earlier compliance produced regret.',
  confidence: 0.68,
  referenced_fact_ids: ['fact-pressure-repeat'],
};

describe('OpenAI-compatible narrative provider', () => {
  it('uses the standard chat-completions interface for LM Studio, Ollama, OpenAI, and custom servers', async () => {
    for (const preset of Object.values(OPENAI_COMPATIBLE_PRESETS)) {
      const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
      const fetcher: typeof fetch = async (input, init) => {
        calls.push([input, init]);
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validResult) } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      };
      const provider = new OpenAICompatibleNarrativeProvider(preset, fetcher);
      await expect(provider.generate(request)).resolves.toEqual(validResult);
      expect(calls[0]?.[0]).toBe(`${preset.baseUrl}/chat/completions`);
    }
  });

  it('rejects narration that references facts unavailable to the citizen', async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ...validResult, referenced_fact_ids: ['hidden-fact'] }) } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const provider = new OpenAICompatibleNarrativeProvider(OPENAI_COMPATIBLE_PRESETS.lmstudio, fetcher);
    await expect(provider.generate(request)).rejects.toThrow('inaccessible facts');
  });

  it('sends API keys only when configured', async () => {
    const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    const fetcher: typeof fetch = async (input, init) => {
      calls.push([input, init]);
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validResult) } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
    const provider = new OpenAICompatibleNarrativeProvider({ ...OPENAI_COMPATIBLE_PRESETS.openai, apiKey: 'secret-test-key' }, fetcher);
    await provider.generate(request);
    expect((calls[0]?.[1]?.headers as Record<string, string>).Authorization).toBe('Bearer secret-test-key');
  });
});

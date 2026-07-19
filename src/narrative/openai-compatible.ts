import { narrativeResultSchema, type NarrativeProvider, type NarrativeProviderStatus, type NarrativeRequest, type NarrativeResult } from './types';

export type OpenAICompatibleConfig = {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  supportsJsonSchema?: boolean;
  temperature?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

export const OPENAI_COMPATIBLE_PRESETS = {
  ollama: { id: 'ollama', label: 'Ollama', baseUrl: 'http://localhost:11434/v1', model: 'gemma3:4b', supportsJsonSchema: true },
  lmstudio: { id: 'lmstudio', label: 'LM Studio', baseUrl: 'http://localhost:1234/v1', model: 'local-model', supportsJsonSchema: true },
  openai: { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', supportsJsonSchema: true },
  custom: { id: 'custom', label: 'Custom OpenAI-compatible server', baseUrl: 'http://localhost:8080/v1', model: 'local-model', supportsJsonSchema: false },
} satisfies Record<string, OpenAICompatibleConfig>;

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) return JSON.parse(fenced);
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error('The model response did not contain valid JSON.');
  }
}

function assertKnowledgeBoundary(result: NarrativeResult, request: NarrativeRequest): NarrativeResult {
  const allowed = new Set(request.knownFacts.map((fact) => fact.id));
  const invalid = result.referenced_fact_ids.filter((id) => !allowed.has(id));
  if (invalid.length) throw new Error(`Narrative referenced inaccessible facts: ${invalid.join(', ')}`);
  return result;
}

export class OpenAICompatibleNarrativeProvider implements NarrativeProvider {
  readonly id: string;
  readonly label: string;
  private readonly config: OpenAICompatibleConfig;
  private readonly fetcher: typeof fetch;

  constructor(config: OpenAICompatibleConfig, fetcher: typeof fetch = fetch) {
    this.config = { temperature: 0.45, timeoutMs: 30_000, ...config };
    this.id = config.id;
    this.label = config.label;
    this.fetcher = fetcher;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
      ...this.config.headers,
    };
  }

  async status(signal?: AbortSignal): Promise<NarrativeProviderStatus> {
    try {
      const response = await this.fetcher(endpoint(this.config.baseUrl, 'models'), { headers: this.headers(), signal });
      if (!response.ok) return { available: false, label: this.label, detail: `Server returned ${response.status}.` };
      return { available: true, label: this.label, detail: `Connected to ${this.config.model}.` };
    } catch (error) {
      return { available: false, label: this.label, detail: error instanceof Error ? error.message : 'Connection failed.' };
    }
  }

  async generate(request: NarrativeRequest, signal?: AbortSignal): Promise<NarrativeResult> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(new Error('Narrative request timed out.')), this.config.timeoutMs);
    const relayAbort = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', relayAbort, { once: true });
    try {
      const response = await this.fetcher(endpoint(this.config.baseUrl, 'chat/completions'), {
        method: 'POST',
        headers: this.headers(),
        signal: controller.signal,
        body: JSON.stringify({
          model: this.config.model,
          temperature: this.config.temperature,
          stream: false,
          messages: [
            {
              role: 'system',
              content: 'You narrate one citizen inside a deterministic city simulation. Use only the supplied known facts. Never invent official events or hidden causes. Return JSON only.',
            },
            { role: 'user', content: JSON.stringify(request) },
          ],
          ...(this.config.supportsJsonSchema
            ? {
                response_format: {
                  type: 'json_schema',
                  json_schema: {
                    name: 'citizen_narrative',
                    strict: true,
                    schema: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['private_interpretation', 'next_action', 'dialogue', 'memory_summary', 'confidence', 'referenced_fact_ids'],
                      properties: {
                        private_interpretation: { type: 'string' },
                        next_action: { type: 'string' },
                        dialogue: { type: 'string' },
                        memory_summary: { type: 'string' },
                        confidence: { type: 'number', minimum: 0, maximum: 1 },
                        referenced_fact_ids: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                },
              }
            : {}),
        }),
      });
      if (!response.ok) throw new Error(`Narrative server returned ${response.status}: ${(await response.text()).slice(0, 240)}`);
      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error('Narrative server returned no message content.');
      const result = narrativeResultSchema.parse(extractJson(content));
      return assertKnowledgeBoundary(result, request);
    } finally {
      globalThis.clearTimeout(timeout);
      signal?.removeEventListener('abort', relayAbort);
    }
  }
}

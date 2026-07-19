# OpenAI-compatible narrative providers

Narrative AI is optional. The city uses authored narration until **Use external narrative provider** is enabled. The API never decides simulation outcomes.

## Presets

| Provider | Default base URL | Default model |
|---|---|---|
| Ollama | `http://localhost:11434/v1` | `gemma3:4b` |
| LM Studio | `http://localhost:1234/v1` | `local-model` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4.1-mini` |
| Custom | `http://localhost:8080/v1` | `local-model` |

Choose any model your server exposes. Change the base URL, model, optional API key, and JSON Schema toggle in the game. API keys are kept in session storage and are not included in exported saves.

The provider must implement:

- `GET /v1/models` for connection testing.
- `POST /v1/chat/completions` for narration.

If a server does not accept `response_format: { type: "json_schema" }`, turn off the JSON Schema option. The response is still parsed and validated locally. A model response is rejected when it references a fact outside the selected citizen’s knowledge, and authored narration is used when the request fails.

import { LLMProvider } from '@agenite/llm';
import { OllamaProvider } from '@agenite/ollama';
import { BedrockProvider } from '@agenite/bedrock';

export type ProviderType = 'ollama' | 'bedrock' | 'mock' | (string & {});

interface ProviderConfig {
  type?: ProviderType;
  apiKey?: string;
  model?: string;
}

/**
 * Factory function to create LLM providers
 */
export function createProvider(config: ProviderConfig): LLMProvider {
  switch (config.type) {
    case 'ollama':
      return new OllamaProvider({
        model: config.model || 'llama3.2',
      });

    case 'bedrock':
      return new BedrockProvider({
        model: config.model || 'anthropic.claude-3-5-haiku-20241022-v1:0',
        region: 'us-west-2',
      });
    default:
      return new OllamaProvider({
        model: config.model || 'llama3.2',
      });
  }
}

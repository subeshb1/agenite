import OpenAI from 'openai';
import {
  LLMProvider,
  Message,
  BaseGenerateOptions,
  AIResponse,
} from '@agenite/llm-core';
import { type OpenAIConfig } from './types';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      baseURL: config.baseURL,
      maxRetries: config.maxRetries,
    });
    this.model = config.model ?? 'gpt-4-turbo-preview';
  }

  async *generateResponse(
    messages: Message[],
    options: BaseGenerateOptions = {}
  ): AsyncGenerator<AIResponse> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true,
    });

    let accumulatedContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      accumulatedContent += content;

      if (options.onToken) {
        options.onToken(content);
      }

      yield {
        content: accumulatedContent,
        isComplete: false,
        metadata: {
          provider: 'openai',
          model: this.model,
        },
      };
    }

    yield {
      content: accumulatedContent,
      isComplete: true,
      metadata: {
        provider: 'openai',
        model: this.model,
      },
    };
  }
}

import OpenAI from 'openai';
import { convertStringToMessages, iterateFromMethods } from '@agenite/llm';
import type {
  LLMProvider,
  BaseMessage,
  GenerateResponse,
  ContentBlock,
  StopReason,
  GenerateOptions,
  PartialReturn,
  IterateGenerateOptions,
} from '@agenite/llm';
import type { OpenAIConfig } from './types';

/**
 * Maps OpenAI finish reasons to our standard stop reasons
 */
function mapStopReason(finishReason: string | null): StopReason | undefined {
  if (!finishReason) return undefined;

  const stopReasonMap: Record<string, StopReason> = {
    stop: 'endTurn',
    length: 'maxTokens',
    tool_calls: 'toolUse',
  };

  return stopReasonMap[finishReason] || undefined;
}

/**
 * Maps OpenAI content to our standard content blocks
 */
function mapContent(
  content: string | null,
  toolCalls?: OpenAI.Chat.ChatCompletionMessageToolCall[]
): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  if (content) {
    blocks.push({ type: 'text', text: content });
  }

  if (toolCalls) {
    toolCalls.forEach((toolCall) => {
      blocks.push({
        type: 'toolUse',
        id: toolCall.id,
        name: toolCall.function.name,
        input: JSON.parse(toolCall.function.arguments),
      });
    });
  }

  return blocks;
}

/**
 * Converts our message format to OpenAI's format
 */
function convertMessages(
  messages: BaseMessage[]
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map((msg): OpenAI.Chat.ChatCompletionMessageParam => {
    const content = msg.content
      .map((block) => {
        if (typeof block === 'string') return block;
        if (block.type === 'text') return block.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');

    return {
      role: msg.role,
      content,
    };
  });
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  readonly name = 'OpenAI';
  readonly version = '1.0';

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      baseURL: config.baseURL,
      maxRetries: config.maxRetries,
    });
    this.model = config.model ?? 'gpt-4-turbo-preview';
  }

  async generate(
    input: string,
    options?: Partial<GenerateOptions>
  ): Promise<GenerateResponse> {
    const startTime = Date.now();
    try {
      const messageArray = convertStringToMessages(input);
      const transformedMessages = convertMessages(messageArray);

      if (options?.systemPrompt) {
        transformedMessages.unshift({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: transformedMessages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        stop: options?.stopSequences,
        tools: options?.tools?.map((tool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
      });

      const choice = response.choices[0];
      if (!choice) throw new Error('No completion choice returned');

      return {
        content: mapContent(choice.message.content, choice.message.tool_calls),
        stopReason: mapStopReason(choice.finish_reason),
        tokens: [
          {
            modelId: response.model,
            inputTokens: response.usage?.prompt_tokens ?? 0,
            outputTokens: response.usage?.completion_tokens ?? 0,
          },
        ],
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw error instanceof Error
        ? new Error(`OpenAI generation failed: ${error.message}`)
        : new Error('OpenAI generation failed with unknown error');
    }
  }

  async *stream(
    input: string,
    options?: Partial<GenerateOptions>
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
    const startTime = Date.now();
    try {
      const messageArray = convertStringToMessages(input);
      const transformedMessages = convertMessages(messageArray);

      if (options?.systemPrompt) {
        transformedMessages.unshift({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      const streamResponse = await this.client.chat.completions.create({
        model: this.model,
        messages: transformedMessages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        stop: options?.stopSequences,
        tools: options?.tools?.map((tool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        stream: true,
      });

      let buffer = '';
      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          buffer += content;

          if (buffer.length > 10) {
            yield {
              type: 'partial',
              content: { type: 'text', text: buffer },
            };
            buffer = '';
          }
        }
      }

      if (buffer.length > 0) {
        yield {
          type: 'partial',
          content: { type: 'text', text: buffer },
        };
      }

      // Get the final completion for metadata
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: transformedMessages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        stop: options?.stopSequences,
        tools: options?.tools?.map((tool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
      });

      const choice = completion.choices[0];
      if (!choice) throw new Error('No completion choice returned');

      return {
        content: mapContent(choice.message.content, choice.message.tool_calls),
        stopReason: mapStopReason(choice.finish_reason),
        tokens: [
          {
            modelId: completion.model,
            inputTokens: completion.usage?.prompt_tokens ?? 0,
            outputTokens: completion.usage?.completion_tokens ?? 0,
          },
        ],
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw error instanceof Error
        ? new Error(`OpenAI generation failed: ${error.message}`)
        : new Error('OpenAI generation failed with unknown error');
    }
  }

  async *iterate(
    input: string | BaseMessage[],
    options: IterateGenerateOptions
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
    return yield* iterateFromMethods(this, input, options);
  }
}

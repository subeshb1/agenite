import OpenAI from 'openai';
import { convertStringToMessages, BaseLLMProvider } from '@agenite/llm';

import type {
  BaseMessage,
  GenerateResponse,
  ContentBlock,
  StopReason,
  GenerateOptions,
  PartialReturn,
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

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;
  private model: string;
  readonly name = 'OpenAI';
  readonly version = '1.0';

  constructor(config: OpenAIConfig) {
    super();
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model ?? 'gpt-4-turbo-preview';
  }

  async generate(
    input: string | BaseMessage[],
    options?: Partial<GenerateOptions>
  ): Promise<GenerateResponse> {
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
            parameters: tool.inputSchema,
          },
        })),
      });

      const choice = response.choices[0];
      if (!choice) throw new Error('No completion choice returned');

      return {
        content: mapContent(choice.message.content, choice.message.tool_calls),
        stopReason: mapStopReason(choice.finish_reason),
        tokenUsage: {
          model: response.model,
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
          inputCost: 0,
          outputCost: 0,
        },
      };
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw error instanceof Error
        ? new Error(`OpenAI generation failed: ${error.message}`)
        : new Error('OpenAI generation failed with unknown error');
    }
  }

  async *stream(
    input: string | BaseMessage[],
    options?: Partial<GenerateOptions>
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
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
            parameters: tool.inputSchema,
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
              type: 'text',
              text: buffer,
            };
            buffer = '';
          }
        }
      }

      if (buffer.length > 0) {
        yield {
          type: 'text',
          text: buffer,
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
            parameters: tool.inputSchema,
          },
        })),
      });

      const choice = completion.choices[0];
      if (!choice) throw new Error('No completion choice returned');

      return {
        content: mapContent(choice.message.content, choice.message.tool_calls),
        stopReason: mapStopReason(choice.finish_reason),
        tokenUsage: {
          model: completion.model,
          inputTokens: completion.usage?.prompt_tokens ?? 0,
          outputTokens: completion.usage?.completion_tokens ?? 0,
          inputCost: 0,
          outputCost: 0,
        },
      };
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw error instanceof Error
        ? new Error(`OpenAI generation failed: ${error.message}`)
        : new Error('OpenAI generation failed with unknown error');
    }
  }
}

import Anthropic from '@anthropic-ai/sdk';
import {
  convertStringToMessages,
  iterateFromMethods,
  BaseLLMProvider,
} from '@agenite/llm';
import type {
  BaseMessage,
  GenerateResponse,
  ContentBlock,
  StopReason,
  GenerateOptions,
  PartialReturn,
  IterateGenerateOptions,
} from '@agenite/llm';
import type { AnthropicConfig } from './types';

/**
 * Maps Anthropic stop reasons to our standard stop reasons
 */
function mapStopReason(stopReason: string | null): StopReason | undefined {
  if (!stopReason) return undefined;

  const stopReasonMap: Record<string, StopReason> = {
    end_turn: 'endTurn',
    max_tokens: 'maxTokens',
    stop_sequence: 'stopSequence',
    tool_use: 'toolUse',
  };

  return stopReasonMap[stopReason] || undefined;
}

/**
 * Maps Anthropic content blocks to our standard content blocks
 */
function mapContent(content: Anthropic.ContentBlockParam[]): ContentBlock[] {
  return content.map((block): ContentBlock => {
    switch (block.type) {
      case 'text':
        return { type: 'text', text: block.text };
      case 'image':
        return {
          type: 'image',
          source: block.source,
        };
      case 'tool_use':
        return {
          type: 'toolUse',
          id: block.id,
          name: block.name,
          input: block.input,
        };
      default:
        throw new Error(
          `Unsupported content block type: ${JSON.stringify(block, null, 2)}`
        );
    }
  });
}

function convertContentBlock(
  block?: ContentBlock | string
): Anthropic.ContentBlockParam | string {
  if (!block) {
    return '';
  }

  if (typeof block === 'string') {
    return block;
  }

  switch (block.type) {
    case 'text':
      return { type: 'text', text: block.text };
    case 'image':
      return {
        type: 'image',
        source:
          block.source.type === 'base64'
            ? {
                type: 'base64',
                data: block.source.data,
                media_type: block.source.media_type as
                  | 'image/jpeg'
                  | 'image/png'
                  | 'image/gif'
                  | 'image/webp',
              }
            : {
                type: 'url',
                url: block.source.url,
              },
      };
    case 'toolUse':
      return {
        type: 'tool_use',
        id: block.id,
        name: block.name,
        input: block.input,
      };
    case 'toolResult':
      return {
        type: 'tool_result',
        tool_use_id: block.toolUseId,
        content:
          typeof block.content === 'string'
            ? block.content
            : block.content?.map(
                (block) => convertContentBlock(block) as Anthropic.TextBlock
              ) || '',
        is_error: block.isError,
      };
    default:
      console.log('block', block);

      throw new Error(
        `Unsupported content block type: ${JSON.stringify(block, null, 2)}`
      );
  }
}

/**
 * Converts our message format to Anthropic's format
 */
function convertMessages(messages: BaseMessage[]): Anthropic.MessageParam[] {
  return messages
    .filter(
      (
        msg
      ): msg is Omit<BaseMessage, 'role'> & { role: 'user' | 'assistant' } =>
        msg.role !== 'system'
    )
    .map((msg) => ({
      role: msg.role,
      content: msg.content.map((block): Anthropic.ContentBlockParam => {
        return convertContentBlock(block) as Anthropic.ContentBlockParam;
      }),
    }));
}

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;
  private model: string;
  readonly name = 'Claude';
  readonly version = '3';

  constructor(config: AnthropicConfig) {
    super();
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.model = config.model ?? 'claude-3-opus-20240229';
  }

  async generate(
    input: string | BaseMessage[],
    options?: Partial<GenerateOptions>
  ): Promise<GenerateResponse> {
    try {
      const messageArray = convertStringToMessages(input);
      const transformedMessages = convertMessages(messageArray);

      const response = await this.client.messages.create({
        model: this.model,
        messages: transformedMessages,
        system: options?.systemPrompt,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature,
        stop_sequences: options?.stopSequences,
      });

      return {
        content: mapContent(response.content),
        stopReason: mapStopReason(response.stop_reason),
        tokenUsage: {
          model: response.model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          inputCost: 0,
          outputCost: 0,
        },
      };
    } catch (error) {
      console.error('Anthropic generation failed:', error);
      throw error instanceof Error
        ? new Error(`Anthropic generation failed: ${error.message}`)
        : new Error('Anthropic generation failed with unknown error');
    }
  }

  async *stream(
    input: string | BaseMessage[],
    options?: Partial<GenerateOptions>
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
    try {
      const messageArray = convertStringToMessages(input);
      const transformedMessages = convertMessages(messageArray);

      const messageStream = await this.client.messages.stream({
        model: this.model,
        messages: transformedMessages,
        system: options?.systemPrompt,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature,
        stop_sequences: options?.stopSequences,
      });

      let buffer = '';
      for await (const chunk of messageStream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          buffer += chunk.delta.text;

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

      const finalMessage = await messageStream.finalMessage();
      return {
        content: mapContent(finalMessage.content),
        stopReason: mapStopReason(finalMessage.stop_reason),
        tokenUsage: {
          model: finalMessage.model,
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens,
          inputCost: 0,
          outputCost: 0,
        },
      };
    } catch (error) {
      console.error('Anthropic generation failed:', error);
      throw error instanceof Error
        ? new Error(`Anthropic generation failed: ${error.message}`)
        : new Error('Anthropic generation failed with unknown error');
    }
  }

  async *iterate(
    input: string | BaseMessage[],
    options: IterateGenerateOptions
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
    return yield* iterateFromMethods(this, input, options);
  }
}

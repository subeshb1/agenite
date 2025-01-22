import Anthropic from '@anthropic-ai/sdk';
import {
  convertStringToMessages,
  generateFromIterate,
  streamFromIterate,
} from '@agenite/llm';
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
          source: {
            type: 'base64',
            media_type: block.source.media_type,
            data: block.source.data,
          },
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
        if (typeof block === 'string') {
          return { type: 'text', text: block };
        }

        switch (block.type) {
          case 'text':
            return { type: 'text', text: block.text };
          case 'image':
            return {
              type: 'image',
              source: {
                type: 'base64',
                media_type: block.source.media_type,
                data: block.source.data,
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
              content: block.content,
              is_error: block.isError,
            };
          default:
            throw new Error(
              `Unsupported content block type: ${JSON.stringify(block, null, 2)}`
            );
        }
      }),
    }));
}

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;
  readonly name = 'Claude';
  readonly version = '3';

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.model = config.model ?? 'claude-3-opus-20240229';
  }

  async generate(
    input: string,
    options?: Partial<GenerateOptions>
  ): Promise<GenerateResponse> {
    return generateFromIterate(this, input, options);
  }

  async *stream(
    input: string,
    options?: Partial<GenerateOptions>
  ): AsyncGenerator<PartialReturn> {
    yield* streamFromIterate(this, input, options);
  }

  async *iterate(
    input: string | BaseMessage[],
    options: IterateGenerateOptions
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
    const {
      systemPrompt,
      maxTokens = 4096,
      temperature,
      stopSequences,
      stream = false,
    } = options;
    const startTime = Date.now();

    try {
      const messageArray =
        typeof input === 'string' ? convertStringToMessages(input) : input;
      const transformedMessages = convertMessages(messageArray);
      const baseParams = {
        model: this.model,
        messages: transformedMessages,
        system: systemPrompt,
        max_tokens: maxTokens,
        temperature,
        stop_sequences: stopSequences,
      };

      if (!stream) {
        const response = await this.client.messages.create(baseParams);

        return {
          content: mapContent(response.content),
          stopReason: mapStopReason(response.stop_reason),
          tokens: [
            {
              modelId: response.model,
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
            },
          ],
          duration: Date.now() - startTime,
        };
      }

      const messageStream = await this.client.messages.stream(baseParams);

      let buffer = '';
      for await (const chunk of messageStream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          buffer += chunk.delta.text;

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

      const finalMessage = await messageStream.finalMessage();
      return {
        content: mapContent(finalMessage.content),
        stopReason: mapStopReason(finalMessage.stop_reason),
        tokens: [
          {
            modelId: finalMessage.model,
            inputTokens: finalMessage.usage.input_tokens,
            outputTokens: finalMessage.usage.output_tokens,
          },
        ],
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Anthropic generation failed:', error);
      throw error instanceof Error
        ? new Error(`Anthropic generation failed: ${error.message}`)
        : new Error('Anthropic generation failed with unknown error');
    }
  }
}

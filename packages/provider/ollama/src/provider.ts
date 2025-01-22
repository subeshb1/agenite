import { Ollama } from 'ollama';
import { convertStringToMessages, BaseLLMProvider } from '@agenite/llm';
import type {
  BaseMessage,
  GenerateResponse,
  GenerateOptions,
  PartialReturn,
  ContentBlock,
} from '@agenite/llm';
import type { OllamaConfig, OllamaMessage } from './types';
import {
  createResponse,
  createTextContent,
  mapStopReason,
  convertMessages,
  convertToolDefinitions,
  convertFunctionCallsToToolUses,
  createError,
  createToolUseContent,
} from './utils';

export class OllamaProvider extends BaseLLMProvider {
  private client: Ollama;
  private config: OllamaConfig;
  readonly name = 'Ollama';
  readonly version = '1.0';

  constructor(config: OllamaConfig) {
    super();
    this.config = config;
    this.client = new Ollama({
      host: config.host,
    });
  }

  /**
   * Creates base chat request parameters
   */
  private createBaseRequest(
    messages: OllamaMessage[],
    options?: Partial<GenerateOptions>
  ) {
    if (options?.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    return {
      model: this.config.model,
      messages,
      options: {
        temperature: options?.temperature,
        num_predict: options?.maxTokens,
        stop: options?.stopSequences,
        ...this.config.parameters,
      },
      tools: convertToolDefinitions(options?.tools),
    };
  }

  /**
   * Prepares messages for chat request
   */
  private prepareMessages(input: string | BaseMessage[]): OllamaMessage[] {
    const messageArray = convertStringToMessages(input);
    return convertMessages(messageArray);
  }

  /**
   * Combines text and tool calls into a single response content
   */
  private combineResponseContent(
    text: string | null | undefined,
    toolCalls?: Array<{
      function: {
        name: string;
        arguments: string | Record<string, unknown>;
      };
    }>
  ): ContentBlock[] {
    const content: ContentBlock[] = [];

    // Add text content if present
    if (text) {
      content.push(createTextContent(text));
    }

    // Add tool calls if present
    if (toolCalls?.length) {
      content.push(...convertFunctionCallsToToolUses(toolCalls));
    }

    return content;
  }

  async generate(
    input: string,
    options?: Partial<GenerateOptions>
  ): Promise<GenerateResponse> {
    const startTime = Date.now();
    try {
      const ollamaMessages = this.prepareMessages(input);
      const response = await this.client.chat({
        ...this.createBaseRequest(ollamaMessages, options),
        stream: false,
      } as const);

      return createResponse(
        this.combineResponseContent(
          response.message.content,
          response.message.tool_calls
        ),
        startTime,
        this.config.model,
        response.prompt_eval_count,
        response.eval_count,
        response.message.tool_calls?.length ? 'toolUse' : mapStopReason('stop')
      );
    } catch (error) {
      throw createError(error, 'generation');
    }
  }

  async *stream(
    input: string | BaseMessage[],
    options?: Partial<GenerateOptions>
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
    const startTime = Date.now();
    try {
      const ollamaMessages = this.prepareMessages(input);
      let buffer = '';
      let finalResponse = undefined;

      const toolCalls = [];
      const response = await this.client.chat({
        ...this.createBaseRequest(ollamaMessages, options),
        stream: true,
      } as const);

      for await (const chunk of response) {
        // Handle text content
        const content = chunk.message?.content;
        if (content) {
          buffer += content;

          // Yield chunks when buffer has reasonable size
          if (buffer.length > 4) {
            yield {
              type: 'text' as const,
              text: buffer,
            };
            buffer = '';
          }
        }

        // Handle tool calls
        if (chunk.message?.tool_calls?.length) {
          // First yield any remaining text in buffer
          if (buffer.length > 0) {
            yield {
              type: 'text' as const,
              text: buffer,
            };
            buffer = '';
          }

          // Then yield each tool call
          for (const toolCall of chunk.message.tool_calls) {
            const tool = {
              type: 'toolUse' as const,
              toolUse: createToolUseContent(
                toolCall.function.name,
                toolCall.function.arguments
              ),
            };

            toolCalls.push(toolCall);

            yield tool;
          }
        }

        finalResponse = chunk;
      }

      // Yield any remaining content in buffer
      if (buffer.length > 0) {
        yield {
          type: 'text' as const,
          text: buffer,
        };
      }

      if (!finalResponse) {
        throw new Error('No final response received');
      }

      // Return final response with combined content
      return createResponse(
        this.combineResponseContent(finalResponse.message?.content, toolCalls),
        startTime,
        this.config.model,
        finalResponse.prompt_eval_count,
        finalResponse.eval_count,
        finalResponse.message.tool_calls?.length
          ? 'toolUse'
          : mapStopReason(finalResponse.done ? 'stop' : null)
      );
    } catch (error) {
      throw createError(error, 'stream');
    }
  }
}

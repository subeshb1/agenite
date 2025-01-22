import { Ollama, type Tool } from 'ollama';
import { convertStringToMessages, iterateFromMethods } from '@agenite/llm';
import type {
  LLMProvider,
  BaseMessage,
  GenerateResponse,
  ContentBlock,
  StopReason,
  ToolDefinition,
  ToolUseBlock,
  ToolResultBlock,
  GenerateOptions,
  PartialReturn,
  IterateGenerateOptions,
} from '@agenite/llm';
import type { OllamaConfig } from './types';

interface ToolParameterValue {
  type: string;
  description?: string;
  enum?: string[];
}

/**
 * Maps Ollama finish reasons to our standard stop reasons
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
 * Converts our message format to Ollama's format
 */
function convertMessages(messages: BaseMessage[]): Array<{
  role: string;
  content: string;
  images?: string[];
  tool_calls?: Array<{
    function: {
      name: string;
      arguments: Record<string, unknown>;
    };
  }>;
  name?: string;
}> {
  const ollamaMessages = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const nextMsg = messages[i + 1];
    if (!msg) continue;

    // Find tool use and its corresponding result
    const toolUse = msg.content.find(
      (block): block is ToolUseBlock =>
        typeof block !== 'string' && block.type === 'toolUse'
    );

    let toolResult: ToolResultBlock | undefined;
    if (toolUse && nextMsg) {
      toolResult = nextMsg.content.find(
        (block): block is ToolResultBlock =>
          typeof block !== 'string' &&
          block.type === 'toolResult' &&
          block.toolUseId === toolUse.id
      );
    }

    // If we have a tool use, format it as assistant with function_call
    if (toolUse) {
      ollamaMessages.push({
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            function: {
              name: toolUse.name,
              arguments: toolUse.input as Record<string, unknown>,
            },
          },
        ],
      });

      // If we have a tool result, format it as function response
      if (toolResult) {
        ollamaMessages.push({
          role: 'tool',
          content: JSON.stringify(toolResult.content),
          name: toolResult.toolName,
        });
        i++; // Skip the next message since we've handled it
        continue;
      }
    }

    // Handle regular messages
    if (!toolUse) {
      // Extract images if any
      const images = msg.content
        .map((block) => {
          if (typeof block === 'string') return null;
          if (block.type === 'image' && block.source.type === 'base64') {
            return block.source.data;
          }
          return null;
        })
        .filter((img): img is string => img !== null);

      // Create base message
      const ollamaMessage: {
        role: string;
        content: string;
        images?: string[];
      } = {
        role: msg.role,
        content: msg.content
          .map((block) => {
            if (typeof block === 'string') return block;
            if (block.type === 'text') return block.text;
            return '';
          })
          .join('\n')
          .trim(),
      };

      // Only add images if there are any
      if (images.length > 0) {
        ollamaMessage.images = images;
      }

      ollamaMessages.push(ollamaMessage);
    }
  }

  return ollamaMessages;
}

/**
 * Converts tool definitions to Ollama's format
 */
function convertToolDefinitions(tools?: ToolDefinition[]): Tool[] | undefined {
  if (!tools?.length) return undefined;

  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.parameters.properties).map(([key, value]) => [
            key,
            {
              type:
                typeof value === 'object' && value && 'type' in value
                  ? String(value.type)
                  : 'string',
              description:
                typeof value === 'object' && value && 'description' in value
                  ? String(value.description)
                  : key,
              ...(typeof value === 'object' && value && 'enum' in value
                ? { enum: (value as ToolParameterValue).enum }
                : {}),
            },
          ])
        ),
        required: tool.parameters.required ?? [],
      },
    },
  }));
}

/**
 * Converts Ollama's function calls to our tool use format
 */
function convertFunctionCallsToToolUses(
  toolCalls: Array<{
    function: {
      name: string;
      arguments: string | Record<string, unknown>;
    };
  }>
): ContentBlock[] {
  return toolCalls.map((toolCall) => {
    const args =
      typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;

    return {
      type: 'toolUse',
      id: crypto.randomUUID(),
      name: toolCall.function.name,
      input: args,
    };
  });
}

export class OllamaProvider implements LLMProvider {
  private client: Ollama;
  private config: OllamaConfig;
  readonly name = 'Ollama';
  readonly version = '1.0';

  constructor(config: OllamaConfig) {
    this.config = config;
    this.client = new Ollama({
      host: config.host,
    });
  }

  async generate(
    input: string,
    options?: Partial<GenerateOptions>
  ): Promise<GenerateResponse> {
    const startTime = Date.now();
    try {
      const messageArray = convertStringToMessages(input);
      const ollamaMessages = convertMessages(messageArray);

      if (options?.systemPrompt) {
        ollamaMessages.unshift({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      const response = await this.client.chat({
        model: this.config.model,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: options?.temperature,
          num_predict: options?.maxTokens,
          stop: options?.stopSequences,
          ...this.config.parameters,
        },
        tools: convertToolDefinitions(options?.tools),
      });

      // Handle tool calls
      if (response.message.tool_calls?.length) {
        return {
          content: convertFunctionCallsToToolUses(response.message.tool_calls),
          tokens: [
            {
              inputTokens: response.prompt_eval_count ?? 0,
              outputTokens: response.eval_count ?? 0,
              modelId: this.config.model,
            },
          ],
          duration: Date.now() - startTime,
          stopReason: 'toolUse',
        };
      }

      return {
        content: [{ type: 'text', text: response.message.content }],
        tokens: [
          {
            inputTokens: response.prompt_eval_count ?? 0,
            outputTokens: response.eval_count ?? 0,
            modelId: this.config.model,
          },
        ],
        duration: Date.now() - startTime,
        stopReason: mapStopReason('stop'),
      };
    } catch (error) {
      console.error('Ollama generation failed:', error);
      throw error instanceof Error
        ? new Error(`Ollama generation failed: ${error.message}`)
        : new Error('Ollama generation failed with unknown error');
    }
  }

  async *stream(
    input: string,
    options?: Partial<GenerateOptions>
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
    const startTime = Date.now();
    try {
      const messageArray = convertStringToMessages(input);
      const ollamaMessages = convertMessages(messageArray);
      let buffer = '';
      let finalResponse:
        | undefined
        | Awaited<ReturnType<typeof this.client.chat>> = undefined;

      if (options?.systemPrompt) {
        ollamaMessages.unshift({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      const response = await this.client.chat({
        model: this.config.model,
        messages: ollamaMessages,
        stream: true,
        options: {
          temperature: options?.temperature,
          num_predict: options?.maxTokens,
          stop: options?.stopSequences,
          ...this.config.parameters,
        },
        tools: convertToolDefinitions(options?.tools),
      });

      for await (const chunk of response) {
        if (chunk.message?.tool_calls?.length) {
          // If we get tool calls in a stream, return them immediately
          return {
            content: convertFunctionCallsToToolUses(chunk.message.tool_calls),
            tokens: [
              {
                inputTokens: chunk.prompt_eval_count ?? 0,
                outputTokens: chunk.eval_count ?? 0,
                modelId: this.config.model,
              },
            ],
            duration: Date.now() - startTime,
            stopReason: 'toolUse',
          };
        }

        const content = chunk.message?.content;
        if (content) {
          buffer += content;

          // Yield chunks when buffer has reasonable size
          if (buffer.length > 4) {
            yield {
              type: 'partial',
              content: { type: 'text', text: buffer },
            };
            buffer = '';
          }
        }
        finalResponse = chunk;
      }

      // Yield any remaining content in buffer
      if (buffer.length > 0) {
        yield {
          type: 'partial',
          content: { type: 'text', text: buffer },
        };
      }
      if (!finalResponse) {
        throw new Error('No final response received');
      }

      // Return final response with metadata
      return {
        content: [{ type: 'text', text: finalResponse.message?.content ?? '' }],
        tokens: [
          {
            inputTokens: finalResponse.prompt_eval_count ?? 0,
            outputTokens: finalResponse.eval_count ?? 0,
            modelId: this.config.model,
          },
        ],
        duration: Date.now() - startTime,
        stopReason: mapStopReason(finalResponse.done ? 'stop' : null),
      };
    } catch (error) {
      console.error('Ollama generation failed:', error);
      throw error instanceof Error
        ? new Error(`Ollama generation failed: ${error.message}`)
        : new Error('Ollama generation failed with unknown error');
    }
  }

  async *iterate(
    input: string | BaseMessage[],
    options: IterateGenerateOptions
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
    return yield* iterateFromMethods(this, input, options);
  }
}

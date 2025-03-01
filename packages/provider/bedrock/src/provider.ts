import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  StopReason,
  ContentBlock as BedrockContentBlock,
  ContentBlockStartEvent,
  ContentBlockDeltaEvent,
  ContentBlockStopEvent,
  ConverseStreamOutput,
  ReasoningContentBlockDelta,
} from '@aws-sdk/client-bedrock-runtime';

import {
  GenerateResponse,
  ToolUseBlock,
  GenerateOptions,
  PartialReturn,
  convertStringToMessages,
  BaseLLMProvider,
  BaseMessage,
} from '@agenite/llm';
import { BedrockConfig } from './types';
import { mapContent, mapStopReason, convertToMessageFormat } from './utils';
import { BedrockToolAdapter } from './tool-adapter';

const DEFAULT_MODEL = 'anthropic.claude-3-sonnet-20240229-v1:0';
const DEFAULT_MAX_TOKENS = 4096;

export class BedrockProvider extends BaseLLMProvider {
  private client: BedrockRuntimeClient;
  private config: BedrockConfig;
  private toolAdapter: BedrockToolAdapter;
  readonly name = 'Bedrock';
  readonly version = '1.0';

  constructor(config: BedrockConfig) {
    super();
    this.config = config;
    this.client = new BedrockRuntimeClient({
      region: config.region,
      credentials: config.credentials,
      ...config.bedrockClientConfig,
    });
    this.toolAdapter = new BedrockToolAdapter();
  }

  private createRequestBody(
    input: string | BaseMessage[],
    options?: Partial<GenerateOptions>
  ) {
    const messageArray = convertStringToMessages(input);
    const transformedMessages = convertToMessageFormat(messageArray);

    const providerTools = options?.tools
      ?.map((tool) => this.toolAdapter.convertToProviderTool(tool))
      .concat([
        {
          cachePoint: {
            type: 'default',
          },
        } as any,
      ]);

    // When reasoning is enabled, we set temperature to 1 as it's the only way to get reasoning
    const temperature = this.config.enableReasoning
      ? 1
      : (options?.temperature ?? this.config.temperature ?? 0.7);

    return {
      modelId: this.config.model || DEFAULT_MODEL,
      system: options?.systemPrompt
        ? ([
            { text: options.systemPrompt },
            {
              cachePoint: {
                type: 'default',
              },
            },
          ] as any)
        : undefined,
      messages: transformedMessages,
      inferenceConfig: {
        maxTokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature,
        stopSequences: options?.stopSequences,
      },
      toolConfig: providerTools?.length
        ? {
            tools: providerTools,
            toolChoice: { auto: {} },
          }
        : undefined,
      additionalModelRequestFields: this.config.enableReasoning
        ? {
            reasoning_config: {
              type: 'enabled',
              budget_tokens: this.config.reasoningBudgetTokens || 1024,
            },
          }
        : undefined,
    };
  }

  private handleError(error: unknown): never {
    console.error('Bedrock generation failed:', error);
    throw error instanceof Error
      ? new Error(`Bedrock generation failed: ${error.message}`)
      : new Error('Bedrock generation failed with unknown error');
  }

  private createGenerateResponse(
    content: GenerateResponse['content'],
    stopReason: StopReason | undefined,
    inputTokens: number,
    outputTokens: number,
    startTime: number
  ): GenerateResponse {
    return {
      content,
      stopReason: mapStopReason(stopReason),
      tokens: [
        {
          modelId: this.config.model || DEFAULT_MODEL,
          inputTokens,
          outputTokens,
        },
      ],
      duration: Date.now() - startTime,
    };
  }

  private handleStreamEvent(
    event: ConverseStreamOutput,
    state: {
      buffer: string;
      inputTokens: number;
      outputTokens: number;
      contentBlocks: BedrockContentBlock[];
    }
  ) {
    // Handle usage metadata
    if ('metadata' in event && event.metadata) {
      state.inputTokens =
        event.metadata.usage?.inputTokens || state.inputTokens;
      state.outputTokens =
        event.metadata.usage?.outputTokens || state.outputTokens;
    }

    // Handle content block start
    if ('contentBlockStart' in event && event.contentBlockStart) {
      this.handleContentBlockStart(
        event.contentBlockStart,
        state.contentBlocks
      );
      return null;
    }

    // Handle content block delta
    if ('contentBlockDelta' in event && event.contentBlockDelta) {
      return this.handleContentBlockDelta(event.contentBlockDelta, state);
    }

    return null;
  }

  private handleContentBlockStart(
    { contentBlockIndex = 0, start }: ContentBlockStartEvent,
    contentBlocks: BedrockContentBlock[]
  ) {
    if (start?.toolUse) {
      contentBlocks[contentBlockIndex] = {
        ...contentBlocks[contentBlockIndex],
        toolUse: {
          ...start.toolUse,
          ...contentBlocks[contentBlockIndex]?.toolUse,
        },
      } as BedrockContentBlock;
    }
  }

  private handleContentBlockDelta(
    { delta, contentBlockIndex = 0 }: ContentBlockDeltaEvent,
    state: {
      buffer: string;
      contentBlocks: BedrockContentBlock[];
    }
  ) {
    if (!delta) return null;

    if (delta.reasoningContent) {
      return this.handleReasoningDelta(
        delta.reasoningContent,
        contentBlockIndex,
        state
      );
    }

    if (delta.text) {
      return this.handleTextDelta(delta.text, contentBlockIndex, state);
    } else if (delta.toolUse) {
      this.handleToolUseDelta(
        delta.toolUse,
        contentBlockIndex,
        state.contentBlocks
      );
    }
    return null;
  }

  private handleTextDelta(
    text: string,
    contentBlockIndex: number,
    state: {
      buffer: string;
      contentBlocks: BedrockContentBlock[];
    }
  ) {
    state.buffer += text || '';

    // Accumulate text in contentBlocks
    state.contentBlocks[contentBlockIndex] = {
      ...state.contentBlocks[contentBlockIndex],
      text: (state.contentBlocks[contentBlockIndex]?.text || '') + text || '',
    } as BedrockContentBlock;

    if (state.buffer.length > 10) {
      const result = {
        type: 'text' as const,
        text: state.buffer,
      };
      state.buffer = '';
      return result;
    }
    return null;
  }

  private handleReasoningDelta(
    reasoningContent: ReasoningContentBlockDelta,
    contentBlockIndex: number,
    state: {
      buffer: string;
      contentBlocks: BedrockContentBlock[];
    }
  ) {
    state.buffer += reasoningContent.text || '';

    // Accumulate reasoning content in contentBlocks
    state.contentBlocks[contentBlockIndex] = {
      ...state.contentBlocks[contentBlockIndex],
      reasoningContent: {
        ...state.contentBlocks[contentBlockIndex]?.reasoningContent,
        reasoningText: {
          text:
            (state.contentBlocks[contentBlockIndex]?.reasoningContent
              ?.reasoningText?.text || '') + (reasoningContent.text || ''),
          signature: reasoningContent.signature,
        },
      },
    } as BedrockContentBlock;

    if (state.buffer.length > 10) {
      const result = {
        type: 'thinking' as const,
        thinking: state.buffer,
      };
      state.buffer = '';
      return result;
    }

    return null;
  }

  private handleToolUseDelta(
    toolUse: { input?: string },
    contentBlockIndex: number,
    contentBlocks: BedrockContentBlock[]
  ) {
    contentBlocks[contentBlockIndex] = {
      toolUse: {
        ...contentBlocks[contentBlockIndex]?.toolUse,
        input:
          (contentBlocks[contentBlockIndex]?.toolUse?.input || '') +
          (toolUse.input || ''),
      },
    } as BedrockContentBlock;
  }

  private handleContentBlockStop(
    event: { contentBlockStop?: ContentBlockStopEvent },
    state: {
      buffer: string;
      contentBlocks: BedrockContentBlock[];
    }
  ): PartialReturn | null {
    if (
      event.contentBlockStop &&
      event.contentBlockStop.contentBlockIndex !== undefined
    ) {
      const blockIndex = event.contentBlockStop.contentBlockIndex;
      const block = state.contentBlocks[blockIndex];

      if (block?.toolUse?.input) {
        block.toolUse.input = JSON.parse(String(block.toolUse.input));
        const toolUseResult = {
          type: 'toolUse' as const,
          toolUse: mapContent([block])[0] as ToolUseBlock,
          isEnd: true,
        };

        return toolUseResult;
      }

      const finalBuffer = state.buffer;
      state.buffer = '';
      if (block?.text) {
        return {
          type: 'text' as const,
          text: finalBuffer,
          isEnd: true,
        } as const;
      }

      if (block?.reasoningContent) {
        return {
          type: 'thinking' as const,
          thinking: finalBuffer,
          isEnd: true,
        } as const;
      }
    }
    return null;
  }

  private handleTextBlockStart(
    event: { contentBlockDelta?: ContentBlockDeltaEvent },
    state: {
      buffer: string;
      contentBlocks: BedrockContentBlock[];
    }
  ) {
    const contentBlockIndex = event.contentBlockDelta?.contentBlockIndex;

    const hasExistingBlock =
      contentBlockIndex !== undefined &&
      state.contentBlocks[contentBlockIndex] !== undefined;

    if (hasExistingBlock) {
      return null;
    }

    if (event.contentBlockDelta?.delta?.text) {
      return {
        type: 'text' as const,
        text: '',
        isStart: true,
      };
    }

    if (event.contentBlockDelta?.delta?.reasoningContent) {
      return {
        type: 'thinking' as const,
        thinking: '',
        isStart: true,
      };
    }
  }

  async *stream(
    input: string | BaseMessage[],
    options?: Partial<GenerateOptions>
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
    const startTime = Date.now();
    try {
      const requestBody = this.createRequestBody(input, options);
      const response = await this.client.send(
        new ConverseStreamCommand({
          ...requestBody,
          ...this.config.converseCommandConfig,
        })
      );

      if (!response.stream) {
        throw new Error('No stream found in response');
      }

      const state = {
        buffer: '',
        inputTokens: 0,
        outputTokens: 0,
        contentBlocks: [] as BedrockContentBlock[],
      };
      let finalStopReason: StopReason | undefined;

      for await (const event of response.stream) {
        // Handle message stop
        if ('messageStop' in event) {
          finalStopReason = event.messageStop?.stopReason;
          continue;
        }

        const startBlock = this.handleTextBlockStart(event, state);

        if (startBlock) {
          yield startBlock;
        }

        // Handle content block stop
        const stopResult = this.handleContentBlockStop(event, state);

        if (stopResult) {
          yield stopResult;
        }
        // Handle other events
        const result = this.handleStreamEvent(event, state);

        if (result) yield result;
      }

      return this.createGenerateResponse(
        mapContent(state.contentBlocks),
        finalStopReason,
        state.inputTokens,
        state.outputTokens,
        startTime
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async generate(
    input: string | BaseMessage[],
    options?: Partial<GenerateOptions>
  ): Promise<GenerateResponse> {
    const startTime = Date.now();
    try {
      const requestBody = this.createRequestBody(input, options);
      const response = await this.client.send(
        new ConverseCommand({
          ...requestBody,
          ...this.config.converseCommandConfig,
        })
      );

      return this.createGenerateResponse(
        mapContent(response.output?.message?.content || []),
        response.stopReason,
        response.usage?.inputTokens || 0,
        response.usage?.outputTokens || 0,
        startTime
      );
    } catch (error) {
      this.handleError(error);
    }
  }
}

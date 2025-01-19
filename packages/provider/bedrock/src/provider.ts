import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  StopReason,
  ContentBlock as BedrockContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import {
  LLMProvider,
  BaseMessage,
  GenerateResponse,
  ToolDefinition,
  ToolUseBlock,
} from '../../../llm/src';
import { BedrockConfig } from './types';
import { mapContent, mapStopReason, convertToMessageFormat } from './utils';
import { BedrockToolAdapter } from './tool-adapter';

const DEFAULT_MODEL = 'anthropic.claude-3-sonnet-20240229-v1:0';
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_REGION = 'us-west-2';

export class BedrockProvider implements LLMProvider {
  private client: BedrockRuntimeClient;
  private config: BedrockConfig;
  private toolAdapter: BedrockToolAdapter;
  readonly name = 'Bedrock';
  readonly version = '1.0';

  constructor(config: BedrockConfig) {
    this.config = config;
    this.client = new BedrockRuntimeClient({
      region: config.region || DEFAULT_REGION,
      credentials: config.credentials,
    });
    this.toolAdapter = new BedrockToolAdapter();
  }

  async *generate(params: {
    messages: BaseMessage[];
    tools?: ToolDefinition[];
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    systemPrompt?: string;
    extraContext?: Record<string, unknown>;
    stream?: boolean;
  }): AsyncGenerator<
    {
      type: 'partial';
      content:
        | [{ type: 'text'; text: string }]
        | [{ type: 'toolUse'; input: ToolUseBlock }];
    },
    GenerateResponse,
    unknown
  > {
    const {
      messages,
      tools,
      systemPrompt,
      temperature = this.config.temperature ?? 0.7,
      maxTokens = this.config.maxTokens ?? DEFAULT_MAX_TOKENS,
      stopSequences,
      stream = false,
    } = params;

    const startTime = Date.now();
    const transformedMessages = convertToMessageFormat(messages);
    const providerTools = tools?.map((tool) =>
      this.toolAdapter.convertToProviderTool(tool)
    );

    const requestBody = {
      modelId: this.config.model || DEFAULT_MODEL,
      system: systemPrompt ? [{ text: systemPrompt }] : undefined,
      messages: transformedMessages,
      inferenceConfig: {
        maxTokens,
        temperature,
        stopSequences,
      },
      toolConfig: providerTools?.length
        ? {
            tools: providerTools,
            toolChoice: { auto: {} },
          }
        : undefined,
    };

    try {
      if (stream) {
        const response = await this.client.send(
          new ConverseStreamCommand(requestBody)
        );

        let buffer = '';
        let inputTokens = 0;
        let outputTokens = 0;
        let finalStopReason: StopReason | undefined;
        const contentBlocks: Record<number, BedrockContentBlock> = {};

        if (!response.stream) {
          throw new Error('No stream found in response');
        }

        for await (const event of response.stream) {
          // Track token usage
          if (event.metadata?.usage) {
            inputTokens = event.metadata.usage.inputTokens || inputTokens;
            outputTokens = event.metadata.usage.outputTokens || outputTokens;
          }

          // Handle message stop
          if ('messageStop' in event) {
            finalStopReason = event.messageStop?.stopReason;
            continue;
          }

          if (
            event.contentBlockStop &&
            event.contentBlockStop.contentBlockIndex !== undefined
          ) {
            if (
              contentBlocks[event.contentBlockStop.contentBlockIndex]?.toolUse
                ?.input
            ) {
              contentBlocks[
                event.contentBlockStop.contentBlockIndex
              ]!.toolUse!.input = JSON.parse(
                String(
                  contentBlocks[event.contentBlockStop.contentBlockIndex]!
                    .toolUse!.input
                )
              );
              yield {
                type: 'partial',
                content: [
                  {
                    type: 'toolUse',
                    input: mapContent([
                      contentBlocks[event.contentBlockStop.contentBlockIndex]!,
                    ])[0] as ToolUseBlock,
                  },
                ],
              };
            }

            if (
              contentBlocks[event.contentBlockStop.contentBlockIndex]?.text &&
              buffer.length > 0
            ) {
              yield {
                type: 'partial',
                content: [{ type: 'text' as const, text: buffer }],
              };
              buffer = '';
            }
          }

          // Handle content block start
          if (event.contentBlockStart) {
            const { contentBlockIndex = 0, start } = event.contentBlockStart;

            if (start?.toolUse) {
              contentBlocks[contentBlockIndex] = {
                ...contentBlocks[contentBlockIndex],
                toolUse: {
                  ...start.toolUse,
                  ...contentBlocks[contentBlockIndex]?.toolUse,
                },
              } as BedrockContentBlock;
            }
            continue;
          }

          // Handle content block delta
          if (event.contentBlockDelta?.delta) {
            const { delta, contentBlockIndex = 0 } = event.contentBlockDelta;

            // Stream text content
            if (delta.text) {
              buffer += delta.text;

              if (buffer.length > 10) {
                yield {
                  type: 'partial',
                  content: [{ type: 'text', text: buffer }],
                };
                buffer = '';
              }

              // Also accumulate text in contentBlocks
              contentBlocks[contentBlockIndex] = {
                ...contentBlocks[contentBlockIndex],
                text:
                  (contentBlocks[contentBlockIndex]?.text || '') + delta.text,
              } as BedrockContentBlock;
            } else if (delta.toolUse) {
              // Accumulate non-text content blocks
              contentBlocks[contentBlockIndex] = {
                toolUse: {
                  ...contentBlocks[contentBlockIndex]?.toolUse,
                  input:
                    (contentBlocks[contentBlockIndex]?.toolUse?.input || '') +
                    (delta.toolUse.input || ''),
                },
              } as BedrockContentBlock;
            }
          }
        }

        // Final response
        const content =
          Object.values(contentBlocks).length > 0
            ? mapContent(Object.values(contentBlocks))
            : [{ type: 'text' as const, text: buffer }];

        return {
          content,
          stopReason: mapStopReason(finalStopReason),
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

      // Handle non-streaming response
      const response = await this.client.send(new ConverseCommand(requestBody));

      return {
        content: mapContent(response.output?.message?.content || []),
        stopReason: mapStopReason(response.stopReason),
        tokens: [
          {
            modelId: this.config.model || DEFAULT_MODEL,
            inputTokens: response.usage?.inputTokens || 0,
            outputTokens: response.usage?.outputTokens || 0,
          },
        ],
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Bedrock generation failed:', error);
      throw error instanceof Error
        ? new Error(`Bedrock generation failed: ${error.message}`)
        : new Error('Bedrock generation failed with unknown error');
    }
  }
}

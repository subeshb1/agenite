import {
  BaseMessage,
  ContentBlock,
  StopReason as AgentStopReason,
} from '@agenite/llm';
import {
  ContentBlock as BedrockContentBlock,
  ImageFormat,
  Message,
  StopReason,
} from '@aws-sdk/client-bedrock-runtime';

/**
 * Maps Bedrock stop reasons to our standard stop reasons
 */
export const mapStopReason = (
  bedrockStopReason?: StopReason
): AgentStopReason | undefined => {
  if (!bedrockStopReason) return undefined;

  const stopReasonMap: Record<Exclude<StopReason, null>, AgentStopReason> = {
    max_tokens: 'maxTokens',
    stop_sequence: 'stopSequence',
    end_turn: 'endTurn',
    tool_use: 'toolUse',
    guardrail_intervened: 'endTurn',
    content_filtered: 'endTurn',
  };

  return stopReasonMap[bedrockStopReason];
};

/**
 * Maps Bedrock content blocks to our standard content blocks
 */
export const mapContent = (
  bedrockContent: BedrockContentBlock[]
): ContentBlock[] => {
  return bedrockContent
    .map((block) => {
      if (block.text) {
        // Check if the text only has whitespace including newlines
        if (/^\s*$/.test(block.text)) {
          return null;
        }

        return {
          type: 'text',
          text: block.text,
        } as const;
      }

      if (block.toolUse) {
        const toolUseId = block.toolUse.toolUseId;
        if (!toolUseId) {
          throw new Error('Tool use ID is required');
        }
        return {
          type: 'toolUse',
          toolName: block.toolUse.name,
          input: block.toolUse.input || {},
          id: toolUseId,
          name: block.toolUse.name || 'unknown',
        } as const;
      }

      if (block.image) {
        const format = block.image.format || 'webp';
        const validFormat = ['jpeg', 'png', 'gif', 'webp'].includes(format)
          ? format
          : 'webp';
        return {
          type: 'image',
          source: {
            type: 'base64',
            data: block.image.source?.$unknown?.[1] || '',
            media_type: `image/${validFormat as 'jpeg' | 'png' | 'gif' | 'webp'}`,
          },
        } as const;
      }

      if (block.reasoningContent) {
        return {
          type: 'thinking',
          thinking: block.reasoningContent.reasoningText?.text || '',
          signature: block.reasoningContent.reasoningText?.signature || '',
        } as const;
      }

      throw new Error(
        `Unsupported content block type: ${JSON.stringify(block, null, 2)}`
      );
    })
    .filter((block) => block !== null);
};

/**
 * Converts our message format to Bedrock's format
 */
export const convertToMessageFormat = (messages: BaseMessage[]): Message[] => {
  return messages
    ?.filter(
      (message): message is BaseMessage & { role: 'user' | 'assistant' } =>
        ['user', 'assistant'].includes(message.role)
    )
    .map((message) => ({
      role: message.role,
      content: message.content.map((block): BedrockContentBlock => {
        if (typeof block === 'string') {
          return {
            text: block,
            $unknown: undefined,
          };
        }

        switch (block.type) {
          case 'text':
            return {
              text: block.text,
              $unknown: undefined,
            };
          case 'toolUse':
            return {
              toolUse: {
                toolUseId: block.id,
                name: block.name,
                input:
                  block.input as BedrockContentBlock.ToolUseMember['toolUse']['input'],
              },
            };
          case 'toolResult':
            return {
              toolResult: {
                toolUseId: block.toolUseId,
                content: [
                  {
                    text: JSON.stringify(block.content),
                  },
                ],
                status: block.isError ? 'error' : 'success',
              },
            };
          case 'image':
            return {
              image: {
                source: {
                  $unknown: ['source', block.source],
                },
                format: (block.source.type === 'url'
                  ? 'url'
                  : (block.source.media_type.split('/')[1] as ImageFormat) ||
                    'webp') as ImageFormat,
              },
              $unknown: undefined,
            };
          case 'thinking':
            return {
              reasoningContent: {
                reasoningText: {
                  text: block.thinking,
                  signature: block.signature as string,
                },
              },
            };
          case 'document':
            return {
              document: {
                format: block.source?.type === 'url' ? 'pdf' : 'txt',
                name: String(block.name || block.title),
                source: {
                  $unknown: ['url', block.source],
                },
              },
            };
          default:
            throw new Error(
              `Unsupported content block type: ${JSON.stringify(block, null, 2)}`
            );
        }
      }),
    }));
};

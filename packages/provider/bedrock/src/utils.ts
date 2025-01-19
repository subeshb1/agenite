import {
  BaseMessage,
  ContentBlock,
  StopReason as AgentStopReason,
} from '../../../llm/src';
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
  return bedrockContent.map((block) => {
    if (block.text) {
      return {
        type: 'text',
        text: block.text,
      };
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
      };
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
      };
    }

    throw new Error(`Unsupported content block type`);
  });
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
                  $unknown: ['base64', block.source.data],
                },
                format:
                  (block.source.media_type.split('/')[1] as ImageFormat) ||
                  'webp',
              },
              $unknown: undefined,
            };
          default:
            throw new Error(
              `Unsupported content block type: ${JSON.stringify(block, null, 2)}`
            );
        }
      }),
    }));
};

import { BaseReturnValues } from '.';
import { Step } from '../types/step';
import { BaseMessage, ToolUseBlock } from '@agenite/llm';
import { ToolResultYieldValues } from './tool-result';
import { ToolResponse } from '@agenite/tool';
export type ToolCallYieldValues = {
  type: 'agenite.tool-call.params';
  toolUseBlocks: ToolUseBlock[];
  hasAgentCall?: boolean;
};

type ToolCallParams = {
  messages: BaseMessage[];
};

export type ToolCallNextValue = {
  type: 'agenite.tool-call.next';
  toolResultBlocks: {
    result: ToolResponse;
    toolUseBlock: ToolUseBlock;
  }[];
};

export const ToolStep: Step<
  BaseReturnValues<Record<string, unknown>>,
  ToolCallYieldValues | ToolResultYieldValues,
  ToolCallParams,
  ToolCallNextValue
> = {
  name: 'agenite.tool-call',
  beforeExecute: async (params) => {
    const lastMessage = params.state.messages[params.state.messages.length - 1];
    if (!lastMessage) {
      throw new Error('No last message found');
    }
    return {
      messages: params.state.messages,
    };
  },
  execute: async function* (params, context) {
    const lastMessage = params.messages[params.messages.length - 1];
    if (!lastMessage) {
      throw new Error('No last message found');
    }
    const toolUseBlocks = lastMessage.content.filter(
      (block) => block.type === 'toolUse'
    );
    if (!toolUseBlocks.length) {
      throw new Error('No tool use block found');
    }

    const agents = context.agent.agentConfig.agents;

    const hasAgentCall = agents?.some((agent) =>
      toolUseBlocks.some(
        (toolUseBlock) => agent.agentConfig.name === toolUseBlock.name
      )
    );

    const userProvidedToolValues = yield {
      type: 'agenite.tool-call.params',
      toolUseBlocks,
      hasAgentCall,
    };

    if (userProvidedToolValues) {
      for (const toolUseBlock of userProvidedToolValues.toolResultBlocks) {
        yield {
          type: 'agenite.tool-result',
          result: toolUseBlock.result,
          toolUseBlock: toolUseBlock.toolUseBlock,
        };
      }

      return {
        next: 'agenite.llm-call',
        state: {
          messages: [
            {
              role: 'user',
              content: userProvidedToolValues.toolResultBlocks.map(
                (toolResultBlock) => ({
                  type: 'toolResult',
                  toolName: toolResultBlock.toolUseBlock.name,
                  toolUseId: toolResultBlock.toolUseBlock.id,
                  content: JSON.stringify(
                    toolResultBlock.result.isError
                      ? `${toolResultBlock.result.data}:${toolResultBlock.result.error}`
                      : toolResultBlock.result.data
                  ),
                  isError: toolResultBlock.result.isError,
                })
              ),
            },
          ],
        },
      };
    }

    if (hasAgentCall) {
      return {
        next: 'agenite.agent-call',
        state: {},
      };
    }

    return {
      next: 'agenite.tool-result',
      state: {},
    };
  },
  afterExecute: async (params) => {
    return params;
  },
};

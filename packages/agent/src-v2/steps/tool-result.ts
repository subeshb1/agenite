import { ToolUseBlock, ToolResultBlock } from '@agenite/llm';
import { Step } from '../types/step';
import { Tool, ToolResponseData } from '@agenite/tool';
import { BaseReturnValues } from '.';

type ToolResultParams = {
  toolUseBlocks: ToolUseBlock[];
  tools: Tool[];
};

export type ToolResultYieldValues = {
  type: 'agenite.tool-result';
  output: ToolResponseData;
};

export const ToolResultStep: Step<
  BaseReturnValues<Record<string, unknown>>,
  ToolResultYieldValues,
  ToolResultParams,
  undefined
> = {
  name: 'agenite.tool-result',
  beforeExecute: async (params) => {
    const lastMessage = params.state.messages[params.state.messages.length - 1];
    if (!lastMessage) {
      throw new Error('No last message found');
    }

    const toolUseBlocks = lastMessage.content.filter(
      (block) => block.type === 'toolUse'
    );

    if (!toolUseBlocks.length) {
      throw new Error('Last message is not a tool use');
    }
    return {
      toolUseBlocks: toolUseBlocks,
      tools: params.currentAgent.agentConfig.tools!,
    };
  },

  execute: async function* ({ toolUseBlocks, tools }) {
    const toolResults: ToolResultBlock[] = [];
    for (const toolUseBlock of toolUseBlocks) {
      const tool = tools.find((t) => t.name === toolUseBlock.name);
      if (!tool) {
        throw new Error(`Tool ${toolUseBlock.toolName} not found`);
      }
      const input = toolUseBlock.input;
      const result = await tool.execute({ input });

      yield {
        type: 'agenite.tool-result',
        output: result.data,
      };

      // TODO: Handle tool content properly i.e handle images, etc.
      toolResults.push({
        type: 'toolResult',
        toolName: tool.name,
        toolUseId: toolUseBlock.id,
        content: JSON.stringify(result.isError ? result.error : result.data),
        isError: result.isError,
      });
    }

    return {
      next: 'agenite.llm-call',
      state: {
        messages: [
          {
            role: 'user',
            content: toolResults,
          },
        ],
      },
    };
  },
  afterExecute: async (params) => {
    return params;
  },
};

import { BaseMessage, ToolUseBlock, ToolResultBlock } from '@agenite/llm';
import { Step } from '../types/step';
import { Tool, ToolResponseData } from '@agenite/tool';

export const ToolResultStep: Step<any, any, any, any> = {
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
      tools: params.currentAgent.tools,
    };
  },

  execute: async function* ({
    toolUseBlocks,
    tools,
  }: {
    toolUseBlocks: ToolUseBlock[];
    tools: Tool[];
  }): AsyncGenerator<
    {
      type: 'agenite.tool-result';
      output: ToolResponseData;
    },
    {
      next: 'agenite.llm-call';
      state: {
        messages: BaseMessage[];
      };
    },
    unknown
  > {
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

      // TODO: Handle tool content properly
      toolResults.push({
        type: 'toolResult',
        toolName: tool.name,
        toolUseId: toolUseBlock.id,
        content: JSON.stringify(result.success ? result.data : result.error),
        isError: !result.success,
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
  afterExecute: async (params: unknown) => {
    return params;
  },
};

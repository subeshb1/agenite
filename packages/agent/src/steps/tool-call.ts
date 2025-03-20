import { BaseReturnValues } from '.';
import { Step } from '../types/step';
import { BaseMessage } from '@agenite/llm';
export type ToolCallYieldValues = {
  type: 'agenite.tool-call.params';
  output: string;
};

type ToolCallParams = {
  messages: BaseMessage[];
};

export const ToolStep: Step<
  BaseReturnValues<Record<string, unknown>>,
  ToolCallYieldValues,
  ToolCallParams,
  undefined
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
    yield {
      type: 'agenite.tool-call.params',
      output: 'Executed tool call',
    };

    const lastMessage = params.messages[params.messages.length - 1];
    if (!lastMessage) {
      throw new Error('No last message found');
    }
    const toolUseBlock = lastMessage.content.find(
      (block) => block.type === 'toolUse'
    );
    if (!toolUseBlock) {
      throw new Error('No tool use block found');
    }

    const agents = context.currentAgent.agentConfig.agents;

    const isAgentCall = agents?.some(
      (agent) => agent?.agentConfig?.name === toolUseBlock.name
    );

    if (isAgentCall) {
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

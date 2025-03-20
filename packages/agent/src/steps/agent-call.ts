import { BaseNextValue, Step } from '../types/step';
import { BaseReturnValues } from '.';
import { BaseMessage, ToolResultBlock, ToolUseBlock } from '@agenite/llm';
import { Agent } from '../agent';
import { LLMCallYieldValues } from './llm-call';
import { ToolCallYieldValues } from './tool-call';
import { ToolResultYieldValues } from './tool-result';

export type AgentCallYieldValues = {
  type: 'agenite.agent-call.start';
  content: string;
};

export type AgentCallParams = {
  targetAgent?: string;
  input?: BaseMessage[];
  context?: Record<string, unknown>;
  toolName?: string;
  toolUseId?: string;
};

export const AgentStep: Step<
  BaseReturnValues<Record<string, unknown>>,
  | AgentCallYieldValues
  | LLMCallYieldValues
  | ToolCallYieldValues
  | ToolResultYieldValues,
  AgentCallParams,
  BaseNextValue
> = {
  name: 'agenite.agent-call',
  beforeExecute: async (params) => {
    const lastMessage = params.state.messages[params.state.messages.length - 1];
    if (!lastMessage) {
      throw new Error('No last message found');
    }

    const agentUseBlocks = lastMessage.content.filter(
      (block): block is ToolUseBlock => block.type === 'toolUse'
    );

    if (!agentUseBlocks.length) {
      throw new Error('Last message is not an agent use');
    }

    const agentUseBlock = agentUseBlocks[0];
    const targetAgent = (
      params.currentAgent.agentConfig.agents as Agent[] | undefined
    )?.find((agent) => agent.agentConfig.name === agentUseBlock?.name);

    if (!targetAgent) {
      throw new Error(`Agent ${agentUseBlock?.name} not found`);
    }

    return {
      targetAgent: agentUseBlock?.name,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: (agentUseBlock?.input as { input: string })?.input,
            },
          ],
        },
      ],
      toolName: agentUseBlock?.name,
      toolUseId: agentUseBlock?.id,
      context: params.context,
    };
  },
  execute: async function* (
    { targetAgent, input, context, toolName, toolUseId },
    executionContext
  ) {
    const targetAgentInstance = (
      executionContext.currentAgent.agentConfig.agents as Agent[] | undefined
    )?.find((agent) => agent.agentConfig.name === targetAgent);

    if (!targetAgentInstance) {
      throw new Error(`Agent ${targetAgent} not found`);
    }

    const result = yield* targetAgentInstance.iterate(
      {
        messages: input,
      },
      {
        context,
        isChildStep: true,
      }
    );

    return {
      next: 'agenite.llm-call',
      state: {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'toolResult',
                toolName: toolName,
                toolUseId: toolUseId,
                content: result.messages[result.messages.length - 1]?.content,
                isError: false,
              },
            ] as ToolResultBlock[],
          },
        ],
      },
    };
  },
  afterExecute: async (params) => {
    return params;
  },
};

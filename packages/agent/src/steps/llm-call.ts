import {
  BaseMessage,
  LLMProvider,
  PartialReturn,
  ToolDefinition,
} from '@agenite/llm';
import { Step } from '../types/step';
import { AgentTool } from '../types/agent';
import { BaseReturnValues } from '.';
import { convertLLMTokenUsage } from '../utils/token-usage';

export type LLMCallInput = {
  messages: BaseMessage[];
  instructions: string;
  tools?: ToolDefinition[];
};

export function transformToToolDefinitions(
  tools: AgentTool[]
): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || '',
    inputSchema: tool.inputSchema || {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description:
            'Detailed instructions for the agent to accomplish the task. Include all necessary information and context for the agent to perform the task.',
        },
      },
    },
  }));
}

export type LLMCallYieldValues =
  | {
      type: 'agenite.llm-call.streaming';
      content: PartialReturn;
    }
  | {
      type: 'agenite.llm-call.input';
      content: LLMCallInput;
    };

type LLMCallParams = {
  provider: LLMProvider;
  messages: BaseMessage[];
  instructions: string;
  tools?: ToolDefinition[];
  stream?: boolean;
};

export const LLMStep: Step<
  BaseReturnValues<{
    messages: BaseMessage[];
  }>,
  LLMCallYieldValues,
  LLMCallParams,
  undefined
> = {
  name: 'agenite.llm-call',
  beforeExecute: async (params) => {
    const tools = params.agent.agentConfig.tools || [];
    const agents =
      params.agent.agentConfig.agents?.map((agent) => {
        return {
          name: agent.agentConfig.name,
          description: agent.agentConfig.description || '',
        };
      }) || [];
    return {
      provider: params.provider,
      messages: params.state.messages,
      instructions: params.instructions,
      tools: transformToToolDefinitions([...tools, ...agents]),
      stream: params.stream,
    };
  },

  execute: async function* (params: LLMCallParams) {
    const { provider, messages, instructions, tools, stream } = params;

    yield {
      type: 'agenite.llm-call.input',
      content: {
        messages,
        instructions,
        tools,
      },
    };

    const generator = provider.iterate(messages, {
      systemPrompt: instructions,
      tools: tools?.length ? tools : undefined,
      stream: stream ?? false,
    });

    let response = await generator.next();
    while (!response.done) {
      const value = response.value;

      yield {
        type: 'agenite.llm-call.streaming',
        content: value,
      };
      response = await generator.next();
    }
    const message = {
      role: 'assistant',
      content: response.value.content,
    } as const;
    const tokenUsage = convertLLMTokenUsage([response.value.tokenUsage].flat());

    if (response.value.stopReason === 'toolUse') {
      return {
        next: 'agenite.tool-call',
        state: {
          messages: [message],
        },
        tokenUsage,
      };
    }

    return {
      next: 'agenite.end',
      state: {
        messages: [message],
      },
      tokenUsage,
    };
  },
  afterExecute: async (params) => {
    return params;
  },
};

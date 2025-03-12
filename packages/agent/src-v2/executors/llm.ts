import {
  BaseMessage,
  LLMProvider,
  PartialReturn,
  ToolDefinition,
} from '@agenite/llm';
import { Executor } from '../types/executor';
import { AgentTool } from '../../src/types/agent';

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

export const LLMExecutor: Executor<any, any, any, any> = {
  name: 'agenite.llm-call',
  beforeExecute: async (params) => {
    return {
      provider: params.provider,
      messages: params.state.messages,
      instructions: params.instructions,
      tools: params.currentAgent.tools,
      stream: params.stream,
    };
  },

  execute: async function* (params: {
    provider: LLMProvider;
    messages: BaseMessage[];
    instructions: string;
    tools?: AgentTool[];
    stream?: boolean;
  }): AsyncGenerator<
    {
      type: 'agenite.llm-call.streaming';
      content: PartialReturn;
    },
    {
      next: 'agenite.tool-result' | 'agenite.tool-call' | 'agenite.end';
      state: {
        messages: BaseMessage[];
      };
    },
    unknown
  > {
    const { provider, messages, instructions, tools, stream } = params;

    const generator = provider.iterate(messages, {
      systemPrompt: instructions,
      tools: tools ? transformToToolDefinitions(tools) : undefined,
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

    if (response.value.stopReason === 'toolUse') {
      return {
        next: 'agenite.tool-call',
        state: {
          messages: [message],
        },
      };
    }

    return {
      next: 'agenite.end',
      state: {
        messages: [message],
      },
    };
  },
  afterExecute: async (params: unknown) => {
    return params;
  },
};

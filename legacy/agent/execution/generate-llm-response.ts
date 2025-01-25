import {
  LLMProvider,
  BaseMessage,
  Tool,
  Agent,
  AgentResponse,
  ExecutionStep,
  ToolDefinition,
  NestedExecutionMetadata,
} from '../types';

export function transformToToolDefinitions(
  tools: (Tool | Agent)[],
): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || '',
    inputSchema:
      'inputSchema' in tool
        ? tool.inputSchema
        : {
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

export async function* generateLLMResponse({
  provider,
  messages,
  systemPrompt,
  tools,
  stream,
  agentName,
  nestedExecution,
}: {
  provider: LLMProvider;
  messages: BaseMessage[];
  systemPrompt?: string;
  tools: (Tool | Agent)[];
  stream?: boolean;
  agentName: string;
  nestedExecution?: NestedExecutionMetadata;
}): AsyncGenerator<ExecutionStep, AgentResponse | undefined, unknown> {
  const responseGenerator = provider.generate({
    messages,
    systemPrompt,
    tools: tools ? transformToToolDefinitions(tools) : undefined,
    stream,
  });

  let iteratorResult = await responseGenerator.next();

  while (!iteratorResult.done) {
    yield {
      type: 'streaming' as const,
      agentName,
      response: {
        message: {
          role: 'assistant',
          content: iteratorResult.value.content,
        },
        tokens: [],
        stopReason: undefined,
      },
      nestedExecution,
    };

    iteratorResult = await responseGenerator.next();
  }

  return {
    message: {
      role: 'assistant',
      content: iteratorResult.value.content,
    },
    tokens: iteratorResult.value.tokens,
    stopReason: iteratorResult.value.stopReason,
  };
}

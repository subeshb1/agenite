import { BaseMessage, LLMProvider, ToolDefinition } from '@agenite/llm';
import { AgentResponse, AgentTool } from '../types/agent';
import { ExecutionMetadata, ExecutionStep } from '../types/execution';

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

export async function* generateLLMResponse({
  provider,
  messages,
  systemPrompt,
  tools,
  stream,
  agentName,
  metadata,
}: {
  provider: LLMProvider;
  messages: BaseMessage[];
  systemPrompt?: string;
  tools: AgentTool[];
  stream?: boolean;
  agentName: string;
  metadata: ExecutionMetadata;
}): AsyncGenerator<ExecutionStep, AgentResponse, unknown> {
  const generator = provider.iterate(messages, {
    systemPrompt,
    tools: tools ? transformToToolDefinitions(tools) : undefined,
    stream: stream ?? false,
  });

  let response = await generator.next();
  while (!response.done) {
    const value = response.value;

    yield {
      type: 'streaming',
      response: value,
      agentName,
      metadata,
    };
    response = await generator.next();
  }

  return {
    message: {
      role: 'assistant',
      content: response.value.content,
    },
    tokens: response.value.tokens,
    stopReason: response.value.stopReason,
  };
}

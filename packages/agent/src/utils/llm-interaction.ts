import {
  BaseMessage,
  LLMProvider,
  ToolDefinition,
  PartialReturn,
  Role,
  TextBlock,
} from '@agenite/llm';
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

  let completion = await generator.next();
  while (!completion.done) {
    const value = completion.value;
    if (value && 'type' in value) {
      const partialReturn = value as PartialReturn;

      if (partialReturn.type === 'text') {
        // Handle streaming response
        yield {
          type: 'streaming',
          agentName,
          response: {
            message: {
              role: 'assistant' as Role,
              content: [
                { type: 'text', text: partialReturn.text } as TextBlock,
              ],
            },
            tokens: [],
          },
          metadata,
        };
      }
    }
    completion = await generator.next();
  }

  return {
    message: {
      role: 'assistant',
      content: completion.value.content,
    },
    tokens: completion.value.tokens,
    stopReason: completion.value.stopReason,
  };
}

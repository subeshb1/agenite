/* eslint-disable turbo/no-undeclared-env-vars */

import { Agent } from '../../src';
import { OpenAIProvider } from '../shared/provider';
import { Tool } from '@agenite/tool';
import { Logger } from '../../src/types';

// Custom logger implementation
class ConsoleLogger implements Logger {
  info(message: string, context?: Record<string, unknown>) {
    console.log(`[INFO] ${message}`, context);
  }
  error(message: string, error: Error, context?: Record<string, unknown>) {
    console.error(`[ERROR] ${message}`, error, context);
  }
  warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[WARN] ${message}`, context);
  }
  debug(message: string, context?: Record<string, unknown>) {
    console.debug(`[DEBUG] ${message}`, context);
  }
}

// Agent factory options
interface CreateAgentOptions {
  name: string;
  provider: OpenAIProvider;
  tools?: Tool[];
  systemPrompt?: string;
  stopCondition?: 'terminal' | 'toolUse' | 'toolResult';
  logger?: Logger;
}

// Agent factory with dependency injection
function createAgent({
  name,
  provider,
  tools = [],
  systemPrompt,
  stopCondition = 'terminal',
  logger = new ConsoleLogger(),
}: CreateAgentOptions): Agent {
  return new Agent({
    name,
    provider,
    tools,
    systemPrompt,
    stopCondition,
    logger,
  });
}

// Agent composition pattern
function createAgentWithTools(
  baseAgent: Agent,
  additionalTools: Tool[]
): Agent {
  return new Agent({
    ...baseAgent,
    tools: [...baseAgent.tools, ...additionalTools],
  });
}

// Example usage
async function main() {
  // Initialize provider
  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview'
  });

  // Create base agent
  const baseAgent = createAgent({
    name: 'base-agent',
    provider,
    systemPrompt: 'You are a helpful assistant.',
  });

  // Create specialized agent with additional tools
  const specializedAgent = createAgentWithTools(
    baseAgent,
    [
      // Add specialized tools here
    ]
  );

  // Example conversation
  const result = await specializedAgent.execute({
    messages: 'Hello! What can you do?',
    context: {
      executionId: 'pattern-demo-1',
      metadata: {
        pattern: 'factory-composition'
      }
    }
  });

  console.log('Response:', result.messages);
}

main().catch(console.error); 

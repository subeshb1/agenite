import {
  Agent,
  AgentContext,
  ExecutionStep,
  LLMProvider,
  Logger,
  ToolExecutionBlock,
  ToolResultBlock,
  ToolResultExecutionBlock,
  DetailedTokenUsage,
  BaseMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
} from '../types';
import { iterate } from './iterate';

interface ExecuteAgentToolParams {
  block: ToolExecutionBlock;
  agentTool: Agent;
  context: AgentContext | undefined;
  provider: LLMProvider;
  logger: Logger;
  agentName: string;
  stream?: boolean;
  currentExecutionPath: string[];
  parentMessages?: BaseMessage[];
}

// Add type guards for better type safety
function isToolUseBlock(block: ContentBlock): block is ToolUseBlock {
  return (
    typeof block === 'object' && 'type' in block && block.type === 'toolUse'
  );
}

function isToolResultBlock(block: ContentBlock): block is ToolResultBlock {
  return (
    typeof block === 'object' && 'type' in block && block.type === 'toolResult'
  );
}

function createTextBlock(text: string): TextBlock {
  return {
    type: 'text',
    text,
  };
}

// New helper function to transform messages
function transformMessages(
  messages: BaseMessage[],
  agentName: string,
): BaseMessage[] {
  // First transform all messages
  const transformedMessages = messages.map((message): BaseMessage => {
    const transformedContent = message.content.map((block): ContentBlock => {
      // Handle tool use blocks
      if (isToolUseBlock(block)) {
        const inputText =
          typeof block.input === 'string'
            ? block.input
            : JSON.stringify(block.input);

        return createTextBlock(inputText);
      }

      // Handle tool result blocks
      if (isToolResultBlock(block)) {
        const resultText =
          typeof block.content === 'string'
            ? block.content
            : JSON.stringify(block.content);

        const formattedResult = `${block.toolName}: ${resultText}`;

        if (block.toolName === agentName) {
          return createTextBlock(formattedResult);
        }

        return createTextBlock(formattedResult);
      }

      return block;
    });

    // Determine the role based on the message type
    let role: 'user' | 'assistant' | 'system';

    if (message.role === 'system') {
      role = 'system';
    } else if (
      message.content.some(
        (block) => isToolResultBlock(block) && block.toolName === agentName,
      )
    ) {
      role = 'assistant';
    } else {
      role = 'user';
    }

    return {
      role,
      content: transformedContent,
    };
  });

  // Now merge consecutive user messages
  const mergedMessages: BaseMessage[] = [];
  let currentMessage: BaseMessage | null = null;

  for (const message of transformedMessages) {
    if (!currentMessage) {
      currentMessage = message;
      continue;
    }

    if (message.role === 'user' && currentMessage.role === 'user') {
      // Merge the content of consecutive user messages
      currentMessage = {
        role: 'user',
        content: [...currentMessage.content, ...message.content],
      };
    } else {
      mergedMessages.push(currentMessage);
      currentMessage = message;
    }
  }

  // Don't forget to push the last message
  if (currentMessage) {
    mergedMessages.push(currentMessage);
  }

  return mergedMessages;
}

// Extract iteration config creation
function createNestedIterationConfig(params: ExecuteAgentToolParams) {
  const {
    block,
    agentTool,
    context,
    provider,
    logger,
    agentName,
    stream,
    currentExecutionPath,
    parentMessages,
  } = params;

  // Create initial message with the tool input
  const inputMessage: BaseMessage = {
    role: 'user',
    content: [
      {
        type: 'text',
        text: JSON.stringify(block.tool.input.input, null, 2),
      },
    ],
  };

  // If parent messages exist, transform them and add the input message
  const messages = [inputMessage];

  console.log('messages', JSON.stringify(messages, null, 2));

  const childContext = {
    executionId: context?.executionId ?? crypto.randomUUID(),
    parentExecutionId: context?.executionId,
    extraContext: context?.extraContext,
  };

  return {
    messages,
    context: childContext,
    provider,
    systemPrompt: agentTool.systemPrompt,
    logger,
    agentName: agentTool.name,
    tools: agentTool.tools,
    stream,
    parentToolUseId: block.tool.id,
    parentAgentName: agentName,
    executionPath: currentExecutionPath,
  };
}

// Extract response processing
function processAgentResponse(lastMessage: BaseMessage): string {
  return lastMessage.content
    .map((block) => {
      if (typeof block === 'string') return block;
      if (block.type === 'text') return block.text;
      return '';
    })
    .join('\n');
}

// Add this new type definition
type AgentToolExecutionResult = {
  toolResult: ToolResultBlock;
  executionBlock: ToolResultExecutionBlock;
  tokenUsage: DetailedTokenUsage;
};

/**
 * Executes a nested agent tool and processes its results
 */
export async function* executeAgentTool(
  params: ExecuteAgentToolParams,
): AsyncGenerator<ExecutionStep, AgentToolExecutionResult> {
  const iterationConfig = createNestedIterationConfig(params);
  const nestedIterator = iterate(iterationConfig);

  // Process all steps from nested agent
  const finalResult = yield* nestedIterator;

  if (!finalResult) {
    throw new Error('No results from nested agent');
  }

  const lastMessage = finalResult.messages
    .filter((msg) => msg.role === 'assistant')
    .pop();

  if (!lastMessage) {
    throw new Error('No response from nested agent');
  }

  const response = processAgentResponse(lastMessage);

  const toolResult: ToolResultBlock = {
    type: 'toolResult',
    toolUseId: params.block.tool.id,
    toolName: params.block.tool.name,
    content: response,
  };

  const executionBlock: ToolResultExecutionBlock = {
    type: 'agent',
    result: toolResult,
  };

  // Just pass through the token usage from the nested agent
  return {
    toolResult,
    executionBlock,
    tokenUsage: finalResult.tokenUsage,
  };
}

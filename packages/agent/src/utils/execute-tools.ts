import { Tool } from '@agenite/tool';
import { Agent } from '../types/agent';
import { ToolResultBlock, ContentBlock, TokenUsage } from '@agenite/llm';
import {
  ToolExecutionBlock,
  ToolResultExecutionBlock,
  ExecutionStep,
  ExecuteToolsParams,
} from '../types/execution';
import { DetailedTokenUsage, AgentContext } from '../types/agent';
import { Logger } from '../types/logger';
import { isAgent } from './tool-mapper';

function convertTokenUsage(usage: TokenUsage): DetailedTokenUsage {
  return {
    total: {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    },
    completion: [usage],
    children: {},
  };
}

function formatContentBlock(block: ContentBlock): string {
  if ('text' in block && block.type === 'text') {
    return block.text;
  }
  if (
    'source' in block &&
    block.type === 'image' &&
    block.source &&
    typeof block.source === 'object' &&
    'media_type' in block.source
  ) {
    return `[Image: ${block.source.media_type}]`;
  }
  if ('toolUse' in block && block.type === 'toolUse') {
    return `[Tool Use: ${block.name}]`;
  }
  if ('toolResult' in block && block.type === 'toolResult') {
    if (typeof block.content === 'string') {
      return block.content;
    }
    if (Array.isArray(block.content)) {
      return block.content.map(formatContentBlock).join('\n');
    }
  }
  return JSON.stringify(block);
}

/**
 * Execute a regular tool
 */
async function executeRegularTool(
  block: ToolExecutionBlock,
  tool: Tool,
  context: AgentContext | undefined,
  logger: Logger
): Promise<{
  toolResult: ToolResultBlock;
  executionBlock: ToolResultExecutionBlock;
  tokenUsage?: DetailedTokenUsage;
}> {
  try {
    const result = await tool.execute({
      input: block.tool.input,
      context: context
        ? {
            ...context,
          }
        : undefined,
    });

    const content =
      typeof result.data === 'string'
        ? result.data
        : result.data
            .map((block) => {
              if ('text' in block && block.type === 'text') {
                return block.text;
              }
              if (
                'source' in block &&
                block.type === 'image' &&
                block.source &&
                typeof block.source === 'object' &&
                'media_type' in block.source
              ) {
                return `[Image: ${block.source.media_type}]`;
              }
              return JSON.stringify(block);
            })
            .join('\n');

    const toolResult: ToolResultBlock = {
      type: 'toolResult',
      toolUseId: block.tool.id,
      toolName: tool.name,
      content,
      isError: !result.success,
    };

    return {
      toolResult,
      executionBlock: { type: 'tool', result: toolResult },
      tokenUsage: result.tokenUsage
        ? convertTokenUsage(result.tokenUsage)
        : undefined,
    };
  } catch (error) {
    logger.error('Tool execution failed', error as Error, {
      toolName: tool.name,
      context,
    });

    const toolResult: ToolResultBlock = {
      type: 'toolResult',
      toolUseId: block.tool.id,
      toolName: tool.name,
      content: `Tool execution failed: ${error}`,
      isError: true,
    };

    return {
      toolResult,
      executionBlock: { type: 'tool', result: toolResult },
    };
  }
}

/**
 * Execute an agent tool
 */
async function* executeAgentTool(
  block: ToolExecutionBlock,
  agent: Agent,
  params: ExecuteToolsParams
): AsyncGenerator<
  ExecutionStep,
  {
    toolResult: ToolResultBlock;
    executionBlock: ToolResultExecutionBlock;
    tokenUsage: DetailedTokenUsage;
  }
> {
  // Create context for nested agent
  const nestedContext: AgentContext = {
    executionId: params.context?.executionId ?? crypto.randomUUID(),
    parentExecutionId: params.context?.executionId,
    metadata: {
      ...params.context?.metadata,
      executionPath: params.currentExecutionPath,
    },
    state: params.context?.state,
  };

  // Execute nested agent
  const iterator = agent.iterate({
    input: JSON.stringify(block.tool.input),
    context: nestedContext,
    stream: params.stream,
  });

  const agentResponse = yield* iterator;

  const lastMessage = agentResponse.messages[agentResponse.messages.length - 1];
  const tokenUsage = agentResponse.tokenUsage;

  // Create tool result
  const response = lastMessage?.content
    ?.map((msg) => formatContentBlock(msg))
    .join('\n');

  const toolResult: ToolResultBlock = {
    type: 'toolResult',
    toolUseId: block.tool.id,
    toolName: agent.name,
    content: response,
  };

  return {
    toolResult,
    executionBlock: { type: 'agent', result: toolResult },
    tokenUsage,
  };
}

/**
 * Execute a series of tools
 */
export async function* executeTools(params: ExecuteToolsParams): AsyncGenerator<
  ExecutionStep,
  {
    results: ToolResultBlock[];
    tokenUsages: DetailedTokenUsage[];
  }
> {
  const results: ToolResultBlock[] = [];
  const tokenUsages: DetailedTokenUsage[] = [];

  for (const block of params.toolExecutionBlocks) {
    const tool = params.tools.find((t) => t.name === block.tool.name);
    if (!tool) {
      throw new Error(`Tool ${block.tool.name} not found`);
    }

    if (block.type === 'agent' && isAgent(tool)) {
      // Execute agent tool
      const agentResult = yield* executeAgentTool(block, tool, params);
      results.push(agentResult.toolResult);
      tokenUsages.push(agentResult.tokenUsage);
    } else if (!isAgent(tool)) {
      // Execute regular tool
      const toolResult = await executeRegularTool(
        block,
        tool,
        params.context,
        params.logger
      );
      results.push(toolResult.toolResult);
      if (toolResult.tokenUsage) {
        tokenUsages.push(toolResult.tokenUsage);
      }
    } else {
      throw new Error(
        `Invalid tool/block combination: ${block.type} - ${tool.name}`
      );
    }
  }

  return { results, tokenUsages };
}

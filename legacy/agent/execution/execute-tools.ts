import {
  Agent,
  Tool,
  Logger,
  ToolExecutionBlock,
  ToolResultBlock,
  ToolResultExecutionBlock,
  AgentContext,
  ExecutionStep,
  DetailedTokenUsage,
  BaseMessage,
} from '../types';
import { executeToolUse } from './execute-tool-use';
import { executeAgentTool } from './execute-agent-tool';
import { isAgent } from '../utils';
import { LLMProvider } from '../types';

type ExecutionResult = {
  toolResult: ToolResultBlock;
  executionBlock: ToolResultExecutionBlock;
  tokenUsage?: DetailedTokenUsage;
};

/**
 * Handles the execution of a single regular tool
 */
async function executeRegularToolBlock(
  block: ToolExecutionBlock,
  tool: Tool,
  params: {
    logger: Logger;
    agentName: string;
    context?: AgentContext;
  },
): Promise<ExecutionResult> {
  const { toolResult, tokenUsage } = await executeToolUse(
    block.tool,
    [tool],
    {
      agentId: params.agentName,
      executionId: params.context?.executionId || '',
    },
    params.logger,
  );

  return {
    toolResult,
    executionBlock: { type: 'tool', result: toolResult },
    tokenUsage,
  };
}

/**
 * Generator function to execute a series of tools and yield results
 */
export async function* executeTools({
  toolExecutionBlocks,
  tools,
  context,
  provider,
  logger,
  agentName,
  stream,
  currentExecutionPath,
  messages,
}: {
  toolExecutionBlocks: ToolExecutionBlock[];
  tools: (Tool | Agent)[];
  context: AgentContext | undefined;
  provider: LLMProvider;
  logger: Logger;
  agentName: string;
  stream?: boolean;
  currentExecutionPath: string[];
  messages?: BaseMessage[];
}): AsyncGenerator<
  ExecutionStep,
  {
    results: ToolResultBlock[];
    tokenUsages: DetailedTokenUsage[];
  },
  ToolResultBlock[] | undefined
> {
  const results: ToolResultBlock[] = [];
  const toolResultExecutionBlocks: ToolResultExecutionBlock[] = [];
  const tokenUsages: DetailedTokenUsage[] = [];

  for (const block of toolExecutionBlocks) {
    const tool = tools.find((t) => t.name === block.tool.name);
    if (!tool) {
      throw new Error(`Tool ${block.tool.name} not found`);
    }

    let executionResult: ExecutionResult;

    if (block.type === 'agent' && isAgent(tool)) {
      executionResult = yield* executeAgentTool({
        block,
        agentTool: tool,
        context,
        provider,
        logger,
        agentName,
        stream,
        currentExecutionPath,
        parentMessages: messages,
      });
    } else if (!isAgent(tool)) {
      executionResult = await executeRegularToolBlock(block, tool, {
        logger,
        agentName,
        context,
      });
    } else {
      throw new Error(
        `Invalid tool/block combination: ${block.type} - ${tool.name}`,
      );
    }

    results.push(executionResult.toolResult);
    toolResultExecutionBlocks.push(executionResult.executionBlock);
    if (executionResult.tokenUsage) {
      tokenUsages.push(executionResult.tokenUsage);
    }
  }

  return { results, tokenUsages };
}

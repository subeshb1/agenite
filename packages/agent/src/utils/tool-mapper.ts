import { Tool } from '@agenite/tool';
import { Agent } from '../types/agent';
import { ToolUseBlock, ToolResultBlock } from '@agenite/llm';
import { ToolExecutionBlock, ToolResultExecutionBlock } from '../types/execution';

/**
 * Checks if a tool is an Agent
 */
export function isAgent(tool: Tool | Agent): tool is Agent {
  return 'stopCondition' in tool;
}

/**
 * Maps a tool use block to a tool execution block
 */
export function mapToolUseBlockToExecution(
  toolUseBlock: ToolUseBlock,
  tools: (Tool | Agent)[]
): ToolExecutionBlock {
  const availableTool = tools.find(t => t.name === toolUseBlock.name);
  return {
    type: availableTool ? (isAgent(availableTool) ? 'agent' : 'tool') : 'tool',
    tool: toolUseBlock,
  };
}

/**
 * Maps content blocks to tool execution blocks
 */
export function mapToolExecutionBlocks(
  toolUseBlocks: ToolUseBlock[],
  tools: (Tool | Agent)[]
): ToolExecutionBlock[] {
  return toolUseBlocks.map(block => mapToolUseBlockToExecution(block, tools));
}

/**
 * Maps tool results to execution blocks
 */
export function mapToolResultsToExecutionBlocks(
  toolResults: ToolResultBlock[],
  toolExecutionBlocks: ToolExecutionBlock[]
): ToolResultExecutionBlock[] {
  return toolResults.map((result): ToolResultExecutionBlock => {
    const originalTool = toolExecutionBlocks.find(
      block => block.tool.id === result.toolUseId
    );

    return {
      type: originalTool?.type || 'tool',
      result: {
        ...result,
        toolName: originalTool?.tool.name || 'unknown',
      },
    };
  });
} 

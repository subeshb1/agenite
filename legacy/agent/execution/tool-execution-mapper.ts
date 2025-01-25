import {
  ToolUseBlock,
  ToolExecutionBlock,
  Tool,
  Agent,
  ToolResultBlock,
  ToolResultExecutionBlock,
  ContentBlock,
} from '../types';
import { isAgent } from '../utils';

/**
 * Filters content blocks to find tool use blocks
 */
export function filterToolUseBlocks(content: ContentBlock[]): ToolUseBlock[] {
  return content.filter(
    (block): block is ToolUseBlock =>
      typeof block !== 'string' && block.type === 'toolUse',
  );
}

/**
 * Maps a tool use block to a tool execution block by determining its type
 */
export function mapToolUseBlockToExecution(
  toolUseBlock: ToolUseBlock,
  tools: (Tool | Agent)[],
): ToolExecutionBlock {
  const availableTool = tools.find((t) => t.name === toolUseBlock.name);
  return {
    type: availableTool ? (isAgent(availableTool) ? 'agent' : 'tool') : 'tool',
    tool: toolUseBlock,
  };
}

/**
 * Maps content blocks to tool execution blocks
 */
export function mapToolExecutionBlocks(
  content: ContentBlock[],
  tools: (Tool | Agent)[],
): ToolExecutionBlock[] {
  const toolUseBlocks = filterToolUseBlocks(content);
  return toolUseBlocks.map((block) => mapToolUseBlockToExecution(block, tools));
}

/**
 * Maps tool results to execution blocks by matching them with their original tools
 */
export function mapToolResultsToExecutionBlocks(
  toolResults: ToolResultBlock[],
  toolExecutionBlocks: ToolExecutionBlock[],
): ToolResultExecutionBlock[] {
  return toolResults.map((result): ToolResultExecutionBlock => {
    const originalTool = toolExecutionBlocks.find(
      (block) => block.tool.id === result.toolUseId,
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

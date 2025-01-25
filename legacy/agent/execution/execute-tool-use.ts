import {
  ToolUseBlock,
  ToolResultBlock,
  Tool,
  Logger,
  DetailedTokenUsage,
} from '../types';

export async function executeToolUse(
  toolUse: ToolUseBlock,
  tools: Tool[],
  context: { agentId: string; executionId: string },
  logger: Logger,
): Promise<{ toolResult: ToolResultBlock; tokenUsage?: DetailedTokenUsage }> {
  const tool = tools.find((t) => t.name === toolUse.name);

  if (!tool) {
    return createToolResult(toolUse, `Tool ${toolUse.name} not found`, true);
  }

  try {
    const result = await tool.execute({
      input: toolUse.input,
      context,
    });

    return {
      ...createToolResult(toolUse, result.data, !result.success),
      tokenUsage: result.tokenUsage,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Tool execution failed';

    logger.error(
      `Tool execution failed: ${toolUse.name}`,
      error instanceof Error ? error : new Error('Unknown error'),
    );

    return createToolResult(toolUse, errorMessage, true);
  }
}

// Helper function to create consistent tool results
function createToolResult(
  toolUse: ToolUseBlock,
  content: ToolResultBlock['content'],
  isError: boolean,
): { toolResult: ToolResultBlock } {
  return {
    toolResult: {
      type: 'toolResult',
      toolUseId: toolUse.id,
      toolName: toolUse.name,
      content,
      isError,
    },
  };
}

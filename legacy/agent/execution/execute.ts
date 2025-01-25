/**
 * Core execution module for automated Agent processing
 *
 * This module provides a simplified execution path when you want to run all agent processing
 * in a single process without manual intervention. It automatically handles the full
 * execution cycle including tool usage and message processing.
 *
 * Use this when:
 * - You want fully automated execution
 * - All tools can be executed in the same process
 * - You don't need step-by-step control
 *
 * For manual control or step-by-step execution, use the iterate() function instead.
 *
 * Dependencies:
 * - BaseMessage: Core message type for agent communication
 * - AgentContext: Execution context for the agent
 * - Agent: Main agent interface
 * - iterate: Step-by-step iteration function
 * - AgentExecutionDependencies: Required dependencies for execution
 */

import {
  BaseMessage,
  AgentContext,
  Agent,
  LLMProvider,
  Logger,
  Tool,
  DetailedTokenUsage,
  StopCondition,
} from '../types';
import { iterate } from './iterate';
import { PrettyPrinter, PrettyPrintOptions } from '../pretty-printer';

export interface ExecuteParams {
  messages: BaseMessage[];
  context: AgentContext | undefined;
  provider: LLMProvider;
  systemPrompt?: string;
  logger: Logger;
  agentName: string;
  tools: (Tool | Agent)[];
  prettyPrint?: PrettyPrintOptions;
  stream?: boolean;
  stopCondition?: StopCondition;
}

export const DEFAULT_PRETTY_PRINT_OPTIONS: PrettyPrintOptions = {
  silent: false,
  colors: true,
  emojis: true,
  compact: false,
};

/**
 * Executes the agent's message processing pipeline automatically
 *
 * @param messages - Array of messages to process
 * @param context - Optional execution context for the agent
 * @param deps - Required dependencies for execution (provider, tools, etc.)
 * @param options - Optional execution options (pretty printing, silent mode, etc.)
 *
 * @returns Promise containing the final execution result with:
 *          - messages: Final state of all messages
 *          - metrics: Execution metrics and statistics
 *
 * Example usage:
 * ```typescript
 * const result = await execute(messages, context, {
 *   provider: llmProvider,
 *   tools: [calculatorTool, weatherTool],
 *   systemPrompt: "You are a helpful assistant",
 *   logger: customLogger,
 *   agentName: "MyAgent"
 * });
 * ```
 *
 * The function automatically:
 * 1. Creates an iterator for message processing
 * 2. Handles all execution steps until completion
 * 3. Returns the final result when done
 */
export const execute = async ({
  prettyPrint = DEFAULT_PRETTY_PRINT_OPTIONS,
  stopCondition = 'terminal',
  ...iterateProps
}: ExecuteParams): Promise<{
  messages: BaseMessage[];
  tokenUsage: DetailedTokenUsage;
}> => {
  const printer = new PrettyPrinter({
    ...prettyPrint,
    stream: iterateProps.stream,
  });

  const stepsIterator = iterate({
    ...iterateProps,
    stopCondition,
  });

  let result = await stepsIterator.next();

  while (!result.done) {
    if (!prettyPrint.silent) {
      printer.print(result.value);
    }

    result = await stepsIterator.next();
  }

  return result.value;
};

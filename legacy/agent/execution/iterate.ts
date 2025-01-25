import {
  BaseMessage,
  AgentContext,
  ExecutionStep,
  ToolResultBlock,
  Logger,
  Agent,
  Tool,
  LLMProvider,
  DetailedTokenUsage,
  StopCondition,
} from '../types';
import { generateLLMResponse } from './generate-llm-response';
import { executeTools } from './execute-tools';
import {
  mapToolExecutionBlocks,
  mapToolResultsToExecutionBlocks,
} from './tool-execution-mapper';
import { TokenUsageTracker } from '../token-usage';

// Types and Interfaces
export interface AgentExecutionDependencies {
  provider: LLMProvider;
  systemPrompt?: string;
  logger: Logger;
  agentName: string;
  tools: Agent['tools'];
}

// Combine common properties into a base interface
interface BaseIterationParams {
  messages: BaseMessage[];
  context: AgentContext | undefined;
  provider: LLMProvider;
  systemPrompt?: string;
  logger: Logger;
  agentName: string;
  tools: (Tool | Agent)[];
  stream?: boolean;
  stopCondition?: StopCondition;
}

// Extend base interface for specific use cases
interface IterateParams extends BaseIterationParams {
  parentToolUseId?: string;
  parentAgentName?: string;
  executionPath?: string[];
}

// InitializeContextParams can now just reference IterateParams since they're identical
type InitializeContextParams = IterateParams;

// IterationContext can also reuse the base interface
interface IterationContext extends BaseIterationParams {
  currentMessages: BaseMessage[];
  nestedExecution: NestedExecutionInfo;
}

interface NestedExecutionInfo {
  toolUseId: string;
  agentName: string;
  parentAgentName: string;
  parentExecutionId?: string;
  executionPath: string[];
}

type IterateReturn = AsyncGenerator<
  ExecutionStep,
  { messages: BaseMessage[]; tokenUsage: DetailedTokenUsage },
  ToolResultBlock[] | undefined
>;

const TERMINAL_STATES = ['maxTokens', 'stopSequence', 'endTurn'];

// New helper functions
function createToolUseStep(
  agentResponse: any,
  toolExecutionBlocks: any[],
  context: IterationContext,
  tokenUsage: DetailedTokenUsage,
): ExecutionStep {
  return {
    type: 'toolUse',
    response: agentResponse,
    tools: toolExecutionBlocks,
    agentName: context.agentName,
    nestedExecution: context.nestedExecution,
    tokenUsage,
  };
}

function createToolResultStep(
  toolResultExecutionBlocks: any[],
  context: IterationContext,
  tokenUsage: DetailedTokenUsage,
): ExecutionStep {
  return {
    type: 'toolResult',
    results: toolResultExecutionBlocks,
    agentName: context.agentName,
    nestedExecution: context.nestedExecution,
    tokenUsage,
  };
}

function createStopStep(
  agentResponse: any,
  context: IterationContext,
  tokenUsage: DetailedTokenUsage,
): ExecutionStep {
  return {
    type: 'stop',
    response: agentResponse,
    agentName: context.agentName,
    nestedExecution: context.nestedExecution,
    tokenUsage,
  };
}

// Main function
export async function* iterate(params: IterateParams): IterateReturn {
  const { logger } = params;
  const iterationContext = initializeContext(params);
  const tokenTracker = new TokenUsageTracker();

  yield createStartStep(iterationContext);

  while (true) {
    logger.debug('Executing step');

    try {
      // Handle LLM Interaction
      const llmGenerator = generateLLMResponse({
        provider: iterationContext.provider,
        messages: iterationContext.currentMessages,
        systemPrompt: iterationContext.systemPrompt,
        tools: iterationContext.tools,
        stream: iterationContext.stream,
        agentName: iterationContext.agentName,
        nestedExecution: iterationContext.nestedExecution,
      });

      const agentResponse = yield* llmGenerator;

      if (!agentResponse) {
        throw new Error('No response received from LLM');
      }

      // Track LLM token usage
      tokenTracker.addCompletionTokens(agentResponse.tokens);

      // Update conversation
      iterationContext.currentMessages.push({
        role: 'assistant',
        content: agentResponse.message.content,
      });

      // Check for terminal state
      const isTerminalState =
        !agentResponse.stopReason ||
        TERMINAL_STATES.includes(agentResponse.stopReason);

      if (isTerminalState) {
        yield createStopStep(
          agentResponse,
          iterationContext,
          tokenTracker.getTokenUsage(),
        );
        break;
      }

      // Handle Tool Execution
      const toolExecutionBlocks = mapToolExecutionBlocks(
        agentResponse.message.content,
        iterationContext.tools,
      );

      iterationContext.logger.debug('Tool use requested', {
        tools: toolExecutionBlocks.map((t) => ({
          name: t.tool.name,
          type: t.type,
        })),
      });

      const toolResults = yield createToolUseStep(
        agentResponse,
        toolExecutionBlocks,
        iterationContext,
        tokenTracker.getTokenUsage(),
      );

      if (params.stopCondition === 'toolUse') {
        break;
      }

      let finalToolResults: ToolResultBlock[];
      let toolTokenUsages: DetailedTokenUsage[] = [];

      if (!toolResults) {
        const toolExecutor = executeTools({
          toolExecutionBlocks,
          tools: iterationContext.tools,
          context: iterationContext.context,
          provider: iterationContext.provider,
          logger: iterationContext.logger,
          agentName: iterationContext.agentName,
          stream: iterationContext.stream,
          currentExecutionPath: iterationContext.nestedExecution.executionPath,
          messages: iterationContext.currentMessages,
        });

        const executorResult = yield* toolExecutor;

        if (!executorResult) {
          throw new Error('No tool results received from executor');
        }

        finalToolResults = executorResult.results;
        toolTokenUsages = executorResult.tokenUsages;
      } else {
        iterationContext.logger.debug(
          'Tool results provided, skipping tool execution',
        );
        finalToolResults = toolResults;
      }

      // Handle token usage from tool executions
      if (toolTokenUsages?.length) {
        tokenTracker.addToolExecutionResults(
          finalToolResults,
          toolExecutionBlocks,
          toolTokenUsages[0],
        );
        tokenTracker.mergeTokenUsages(toolTokenUsages.slice(1)); // Merge any nested executions
      }

      // Update conversation with tool results
      iterationContext.currentMessages.push({
        role: 'user',
        content: finalToolResults,
      });

      const toolResultExecutionBlocks = mapToolResultsToExecutionBlocks(
        finalToolResults,
        toolExecutionBlocks,
      );

      yield createToolResultStep(
        toolResultExecutionBlocks,
        iterationContext,
        tokenTracker.getTokenUsage(),
      );

      if (params.stopCondition === 'toolResult') {
        break;
      }
    } catch (error) {
      handleError(error, iterationContext.logger);
      throw error;
    }
  }

  return {
    messages: iterationContext.currentMessages,
    tokenUsage: tokenTracker.getTokenUsage(),
  };
}

// Helper functions
function initializeContext(params: InitializeContextParams): IterationContext {
  const currentExecutionPath = [
    ...(params.executionPath || []),
    params.agentName,
  ];

  const nestedExecution: NestedExecutionInfo = {
    toolUseId: params.parentToolUseId || '',
    agentName: params.agentName,
    parentAgentName: params.parentAgentName || '',
    parentExecutionId: params.context?.parentExecutionId,
    executionPath: currentExecutionPath,
  };

  return {
    currentMessages: [...params.messages],
    logger: params.logger,
    nestedExecution,
    context: params.context,
    provider: params.provider,
    systemPrompt: params.systemPrompt,
    tools: params.tools,
    stream: params.stream,
    agentName: params.agentName,
    messages: params.messages,
    stopCondition: params.stopCondition,
  };
}

function createStartStep(context: IterationContext): ExecutionStep {
  return {
    type: 'start',
    agentName: context.agentName,
    message: context.currentMessages[context.currentMessages.length - 1],
    nestedExecution: context.nestedExecution,
  };
}

function handleError(error: unknown, logger: Logger): void {
  logger.error(
    'Step execution failed',
    error instanceof Error ? error : new Error('Unknown error'),
  );
}

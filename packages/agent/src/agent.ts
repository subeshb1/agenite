import {
  BaseMessage,
  LLMProvider,
  Role,
  TextBlock,
  ToolResultBlock,
  ToolUseBlock,
} from '@agenite/llm';
import {
  Agent as AgentInterface,
  AgentOptions,
  AgentExecuteParams,
  AgentExecuteResult,
  AgentResponse,
  DetailedTokenUsage,
  StopCondition,
  AgentTool,
} from './types/agent';
import {
  ExecutionStep,
  ExecutionMetadata,
  ExecutionToolUseStep,
  ExecutionStartStep,
  ExecutionStopStep,
  ExecutionToolResultStep,
  ToolExecutionBlock,
  ToolResultExecutionBlock,
} from './types/execution';
import { Logger } from './types/logger';
import {
  executeTools,
  mapToolExecutionBlocks,
  mapToolResultsToExecutionBlocks,
  TokenUsageTracker,
  generateLLMResponse,
} from './utils';

const TERMINAL_STATES = ['maxTokens', 'stopSequence', 'endTurn'];

interface IterationContext {
  currentMessages: BaseMessage[];
  metadata: ExecutionMetadata;
  provider: LLMProvider;
  systemPrompt?: string;
  tools: AgentTool[];
  stream?: boolean;
  agentName: string;
  logger?: Logger;
  context?: AgentExecuteParams['context'];
}

export class Agent implements AgentInterface {
  public readonly name: string;
  public readonly provider: LLMProvider;
  public readonly tools: AgentTool[];
  public readonly systemPrompt?: string;
  public readonly description?: string;
  public readonly stopCondition: StopCondition;
  private readonly logger?: Logger;

  constructor(options: AgentOptions) {
    this.name = options.name;
    this.provider = options.provider;
    this.tools = options.tools ?? [];
    this.systemPrompt = options.systemPrompt;
    this.description = options.description;
    this.stopCondition = options.stopCondition ?? 'terminal';
    this.logger = options.logger;
  }

  public async execute(
    params: AgentExecuteParams
  ): Promise<AgentExecuteResult> {
    const iterator = this.iterate(params);
    let result = await iterator.next();
    while (!result.done) {
      result = await iterator.next();
    }
    return result.value;
  }

  private createToolUseStep(
    response: AgentResponse,
    toolExecutionBlocks: ToolExecutionBlock[],
    context: IterationContext,
    tokenUsage: DetailedTokenUsage
  ): ExecutionToolUseStep {
    return {
      type: 'toolUse',
      agentName: context.agentName,
      response,
      tools: toolExecutionBlocks,
      tokenUsage,
      metadata: context.metadata,
    };
  }

  private createToolResultStep(
    resultBlocks: ToolResultExecutionBlock[],
    context: IterationContext,
    tokenUsage: DetailedTokenUsage
  ): ExecutionToolResultStep {
    return {
      type: 'toolResult',
      agentName: context.agentName,
      results: resultBlocks,
      tokenUsage,
      metadata: context.metadata,
    };
  }

  private createStopStep(
    response: AgentResponse,
    context: IterationContext,
    tokenUsage: DetailedTokenUsage
  ): ExecutionStopStep {
    return {
      type: 'stop',
      agentName: context.agentName,
      response,
      tokenUsage,
      metadata: context.metadata,
    };
  }

  private createStartStep(context: IterationContext): ExecutionStartStep {
    const lastMessage =
      context.currentMessages[context.currentMessages.length - 1];
    if (!lastMessage) {
      throw new Error('No valid message found');
    }

    return {
      type: 'start',
      agentName: context.agentName,
      message: lastMessage,
      metadata: context.metadata,
    };
  }

  private initializeContext(params: AgentExecuteParams): IterationContext {
    const messages = Array.isArray(params.messages)
      ? params.messages
      : [
          {
            role: 'user' as Role,
            content: [
              {
                type: 'text',
                text: params.messages,
              } as TextBlock,
            ],
          },
        ];

    return {
      currentMessages: messages,
      metadata: this.createExecutionMetadata(params.context),
      provider: this.provider,
      systemPrompt: this.systemPrompt,
      tools: this.tools,
      stream: params.stream,
      agentName: this.name,
      logger: this.logger,
      context: params.context,
    };
  }

  public async *iterate(
    params: AgentExecuteParams
  ): AsyncGenerator<
    ExecutionStep,
    { messages: BaseMessage[]; tokenUsage: DetailedTokenUsage },
    ToolResultBlock[] | undefined
  > {
    const context = this.initializeContext(params);
    const tokenTracker = new TokenUsageTracker();

    if (context.currentMessages.length === 0) {
      throw new Error('No messages provided');
    }

    yield this.createStartStep(context);

    while (true) {
      this.logger?.debug('Executing step');

      try {
        // Handle LLM Interaction
        const generator = generateLLMResponse({
          provider: context.provider,
          messages: context.currentMessages,
          systemPrompt: context.systemPrompt,
          tools: context.tools,
          stream: context.stream ?? false,
          agentName: context.agentName,
          metadata: context.metadata,
        });

        const agentResponse = yield* generator;

        // Track LLM token usage
        tokenTracker.addCompletionTokens(agentResponse.tokens);

        // Update conversation
        context.currentMessages.push(agentResponse.message);

        // Check for terminal state
        const isTerminalState =
          !agentResponse.stopReason ||
          TERMINAL_STATES.includes(agentResponse.stopReason);

        if (isTerminalState) {
          yield this.createStopStep(
            agentResponse,
            context,
            tokenTracker.getTokenUsage()
          );
          break;
        }

        // Handle Tool Execution
        const toolUseBlocks = agentResponse.message.content.filter(
          (block): block is ToolUseBlock => block.type === 'toolUse'
        );

        const toolExecutionBlocks = mapToolExecutionBlocks(
          toolUseBlocks,
          context.tools
        );

        context.logger?.debug('Tool use requested', {
          tools: toolExecutionBlocks.map((t) => ({
            name: t.tool.name,
            type: t.type,
          })),
        });

        const toolResults = yield this.createToolUseStep(
          agentResponse,
          toolExecutionBlocks,
          context,
          tokenTracker.getTokenUsage()
        );

        console.log('Executing tools');
        if (this.stopCondition === 'toolUse') {
          break;
        }

        let finalToolResults: ToolResultBlock[];
        let toolTokenUsages: DetailedTokenUsage[] = [];

        if (!toolResults) {
          const toolExecutor = executeTools({
            toolExecutionBlocks,
            tools: context.tools,
            context: context.context,
            logger: context.logger ?? console,
            agentName: context.agentName,
            metadata: context.metadata,
            provider: context.provider,
            stream: context.stream,
            currentExecutionPath: [context.agentName],
            messages: context.currentMessages,
          });

          const executorResult = yield* toolExecutor;

          if (!executorResult) {
            throw new Error('No tool results received from executor');
          }

          finalToolResults = executorResult.results;
          toolTokenUsages = executorResult.tokenUsages;
        } else {
          context.logger?.debug(
            'Tool results provided, skipping tool execution'
          );
          finalToolResults = toolResults;
        }

        // Handle token usage from tool executions
        if (toolTokenUsages?.length) {
          const firstTokenUsage = toolTokenUsages[0];
          if (firstTokenUsage) {
            tokenTracker.addToolExecutionResults(
              finalToolResults,
              toolExecutionBlocks,
              firstTokenUsage
            );
            tokenTracker.mergeTokenUsages(toolTokenUsages.slice(1)); // Merge any nested executions
          }
        }

        // Update conversation with tool results
        context.currentMessages.push({
          role: 'user',
          content: finalToolResults,
        });

        const toolResultExecutionBlocks = mapToolResultsToExecutionBlocks(
          finalToolResults,
          toolExecutionBlocks
        );

        yield this.createToolResultStep(
          toolResultExecutionBlocks,
          context,
          tokenTracker.getTokenUsage()
        );

        if (this.stopCondition === 'toolResult') {
          break;
        }
      } catch (error) {
        this.logger?.error('Step execution failed', error as Error);
        throw error;
      }
    }

    return {
      messages: context.currentMessages,
      tokenUsage: tokenTracker.getTokenUsage(),
    };
  }

  private createExecutionMetadata(
    context?: AgentExecuteParams['context']
  ): ExecutionMetadata {
    return {
      toolUseId: crypto.randomUUID(),
      agentName: this.name,
      parentExecutionId: context?.parentExecutionId,
      executionPath: context?.parentExecutionId
        ? [...((context.metadata?.executionPath as string[]) || []), this.name]
        : [this.name],
    };
  }

  private mergeTokenUsage(
    current: DetailedTokenUsage,
    additional: DetailedTokenUsage
  ): DetailedTokenUsage {
    return {
      total: {
        inputTokens: current.total.inputTokens + additional.total.inputTokens,
        outputTokens:
          current.total.outputTokens + additional.total.outputTokens,
      },
      completion: [...current.completion, ...additional.completion],
      children: {
        ...current.children,
        ...additional.children,
      },
    };
  }
}

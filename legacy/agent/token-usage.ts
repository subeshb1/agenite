import {
  DetailedTokenUsage,
  TokenUsage,
  ToolExecutionBlock,
  ToolResultBlock,
} from './types';

export class TokenUsageTracker {
  private tokenUsage: DetailedTokenUsage;

  constructor() {
    this.tokenUsage = {
      total: { inputTokens: 0, outputTokens: 0 },
      completion: [],
      children: {},
    };
  }

  addCompletionTokens(tokens: TokenUsage[]) {
    this.tokenUsage.completion.push(...tokens);
    this.updateTotals(tokens);
  }

  addToolExecutionResults(
    toolResults: ToolResultBlock[],
    toolExecutionBlocks: ToolExecutionBlock[],
    tokenUsage: DetailedTokenUsage,
  ) {
    for (const result of toolResults) {
      const toolExecutionBlock = toolExecutionBlocks.find(
        (block) => block.tool.name === result.toolName,
      );

      if (toolExecutionBlock) {
        this.addToolTokenUsage(
          result.toolName,
          tokenUsage,
          toolExecutionBlock.type === 'agent',
        );
      }
    }
  }

  private addToolTokenUsage(
    toolName: string,
    toolTokenUsage: DetailedTokenUsage,
    isAgent: boolean,
  ) {
    // Initialize child entry if it doesn't exist
    if (!this.tokenUsage.children[toolName]) {
      this.tokenUsage.children[toolName] = {
        usage: [],
        details: undefined,
      };
    }

    if (isAgent) {
      // For agent tools, merge the complete token usage structure
      this.tokenUsage.children[toolName] = {
        usage: [...toolTokenUsage.completion],
        details: {
          total: { ...toolTokenUsage.total },
          completion: [...toolTokenUsage.completion],
          children: { ...toolTokenUsage.children },
        },
      };
    } else {
      // For regular tools, store their completion tokens
      this.tokenUsage.children[toolName].usage = [...toolTokenUsage.completion];
    }

    // Update totals
    this.tokenUsage.total.inputTokens += toolTokenUsage.total.inputTokens;
    this.tokenUsage.total.outputTokens += toolTokenUsage.total.outputTokens;
  }

  private updateTotals(tokens: TokenUsage[]) {
    tokens.forEach((t) => {
      this.tokenUsage.total.inputTokens += t.inputTokens;
      this.tokenUsage.total.outputTokens += t.outputTokens;
    });
  }

  mergeTokenUsage(tokenUsage: DetailedTokenUsage) {
    // Merge completion tokens
    this.tokenUsage.completion.push(...tokenUsage.completion);

    // Merge children
    for (const [toolName, childUsage] of Object.entries(tokenUsage.children)) {
      if (!this.tokenUsage.children[toolName]) {
        this.tokenUsage.children[toolName] = {
          usage: [...childUsage.usage],
          details: childUsage.details
            ? {
                total: { ...childUsage.details.total },
                completion: [...childUsage.details.completion],
                children: { ...childUsage.details.children },
              }
            : undefined,
        };
      } else {
        this.tokenUsage.children[toolName].usage.push(...childUsage.usage);
        if (childUsage.details) {
          this.tokenUsage.children[toolName].details = {
            total: { ...childUsage.details.total },
            completion: [...childUsage.details.completion],
            children: { ...childUsage.details.children },
          };
        }
      }
    }

    // Update totals
    this.tokenUsage.total.inputTokens += tokenUsage.total.inputTokens;
    this.tokenUsage.total.outputTokens += tokenUsage.total.outputTokens;
  }

  mergeTokenUsages(tokenUsages: DetailedTokenUsage[]) {
    tokenUsages.forEach((usage) => this.mergeTokenUsage(usage));
  }

  getTokenUsage(): DetailedTokenUsage {
    return this.tokenUsage;
  }
}

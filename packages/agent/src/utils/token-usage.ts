import { TokenUsage } from '@agenite/llm';
import { DetailedTokenUsage } from '../types/agent';
import { ToolExecutionBlock } from '../types/execution';
import { ToolResultBlock } from '@agenite/llm';

export class TokenUsageTracker {
  private tokenUsage: DetailedTokenUsage;

  constructor() {
    this.tokenUsage = {
      total: { inputTokens: 0, outputTokens: 0 },
      completion: [],
      children: {},
    };
  }

  public addCompletionTokens(tokens: TokenUsage[]): void {
    this.tokenUsage.completion.push(...tokens);
    this.updateTotalTokens();
  }

  public addToolExecutionResults(
    results: ToolResultBlock[],
    executionBlocks: ToolExecutionBlock[],
    tokenUsage: DetailedTokenUsage
  ): void {
    // Add token usage for each tool execution
    executionBlocks.forEach((block, index) => {
      const result = results[index];
      if (result && block.tool.name) {
        this.tokenUsage.children[block.tool.name] = {
          usage: tokenUsage.completion,
          details: tokenUsage,
        };
      }
    });

    this.updateTotalTokens();
  }

  public mergeTokenUsages(tokenUsages: DetailedTokenUsage[]): void {
    tokenUsages.forEach((usage) => {
      // Merge completion tokens
      this.tokenUsage.completion.push(...usage.completion);

      // Merge children
      Object.entries(usage.children).forEach(([name, child]) => {
        if (this.tokenUsage.children[name]) {
          this.tokenUsage.children[name].usage.push(...child.usage);
          if (child.details) {
            this.tokenUsage.children[name].details = this.mergeDetailedTokenUsage(
              this.tokenUsage.children[name].details!,
              child.details
            );
          }
        } else {
          this.tokenUsage.children[name] = child;
        }
      });
    });

    this.updateTotalTokens();
  }

  public getTokenUsage(): DetailedTokenUsage {
    return this.tokenUsage;
  }

  private updateTotalTokens(): void {
    this.tokenUsage.total = {
      inputTokens: this.tokenUsage.completion.reduce(
        (sum, t) => sum + t.inputTokens,
        0
      ),
      outputTokens: this.tokenUsage.completion.reduce(
        (sum, t) => sum + t.outputTokens,
        0
      ),
    };
  }

  private mergeDetailedTokenUsage(
    current: DetailedTokenUsage,
    additional: DetailedTokenUsage
  ): DetailedTokenUsage {
    return {
      total: {
        inputTokens: current.total.inputTokens + additional.total.inputTokens,
        outputTokens: current.total.outputTokens + additional.total.outputTokens,
      },
      completion: [...current.completion, ...additional.completion],
      children: {
        ...current.children,
        ...additional.children,
      },
    };
  }
} 

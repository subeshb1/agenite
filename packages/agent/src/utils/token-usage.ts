import { TokenUsage } from '../types/agent';
import { TokenUsage as LLMTokenUsage } from '@agenite/llm';

/**
 * Merges two token usage objects by adding their values together
 * @param oldUsage The existing token usage
 * @param newUsage The new token usage to merge
 * @returns A new token usage object with combined values
 */
export function mergeTokenUsage(
  oldUsage: TokenUsage,
  newUsage: TokenUsage
): TokenUsage {
  return {
    inputTokens: oldUsage.inputTokens + newUsage.inputTokens,
    outputTokens: oldUsage.outputTokens + newUsage.outputTokens,
    totalTokens: oldUsage.totalTokens + newUsage.totalTokens,
    inputCost: oldUsage.inputCost + newUsage.inputCost,
    outputCost: oldUsage.outputCost + newUsage.outputCost,
    totalCost: oldUsage.totalCost + newUsage.totalCost,
  };
}

/**
 * Merges two agent token usage objects by adding their values together
 * @param oldUsage The existing agent token usage
 * @param newUsage The new agent token usage to merge
 * @returns A new agent token usage object with combined values
 */
export function mergeAgentTokenUsage(
  oldUsage: TokenUsage & { modelBreakdown: Record<string, TokenUsage> },
  newUsage: TokenUsage & { modelBreakdown: Record<string, TokenUsage> }
): TokenUsage & { modelBreakdown: Record<string, TokenUsage> } {
  const mergedBreakdown: Record<string, TokenUsage> = {
    ...oldUsage.modelBreakdown,
  };

  // Merge model breakdowns
  Object.entries(newUsage.modelBreakdown).forEach(([model, usage]) => {
    mergedBreakdown[model] = mergeTokenUsage(
      mergedBreakdown[model] || {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
      },
      usage
    );
  });

  return {
    ...mergeTokenUsage(oldUsage, newUsage),
    modelBreakdown: mergedBreakdown,
  };
}

/**
 * Converts LLM token usage to Agent token usage format
 * @param llmTokenUsages Array of LLM token usage objects
 * @returns Agent token usage object with model breakdown
 */
export function convertLLMTokenUsage(
  llmTokenUsages: LLMTokenUsage[]
): TokenUsage & { modelBreakdown: Record<string, TokenUsage> } {
  const modelBreakdown: Record<string, TokenUsage> = {};
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Process each model's token usage
  llmTokenUsages.forEach((usage) => {
    const model = usage.model;
    const inputTokens = usage.inputTokens;
    const outputTokens = usage.outputTokens;
    const totalTokens = inputTokens + outputTokens;
    const inputCost = usage.inputCost;
    const outputCost = usage.outputCost;
    const totalCost = inputCost + outputCost;

    modelBreakdown[model] = {
      inputTokens,
      outputTokens,
      totalTokens,
      inputCost,
      outputCost,
      totalCost,
    };

    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;
  });

  const totalTokens = totalInputTokens + totalOutputTokens;
  const totalInputCost = Object.values(modelBreakdown).reduce(
    (sum, usage) => sum + usage.inputCost,
    0
  );
  const totalOutputCost = Object.values(modelBreakdown).reduce(
    (sum, usage) => sum + usage.outputCost,
    0
  );
  const totalCost = totalInputCost + totalOutputCost;

  return {
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    totalTokens,
    inputCost: totalInputCost,
    outputCost: totalOutputCost,
    totalCost,
    modelBreakdown,
  };
}

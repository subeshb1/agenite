import { Tool, Agent, DetailedTokenUsage } from './types';

/**
 * Type guard to check if a tool is actually an Agent
 */
export function isAgent(tool: Tool | Agent): tool is Agent {
  return (tool as Agent).executableType === 'agent';
}

/**
 * Merges two DetailedTokenUsage objects into one
 */
export function mergeDetailedTokenUsage(
  base: DetailedTokenUsage,
  addition: DetailedTokenUsage,
): DetailedTokenUsage {
  const merged: DetailedTokenUsage = {
    total: {
      inputTokens: base.total.inputTokens + addition.total.inputTokens,
      outputTokens: base.total.outputTokens + addition.total.outputTokens,
    },
    completion: [...base.completion, ...addition.completion],
    children: { ...base.children },
  };

  // Merge child token usages
  for (const [name, childData] of Object.entries(addition.children)) {
    if (!merged.children[name]) {
      merged.children[name] = {
        usage: [],
        details: undefined,
      };
    }

    // Merge usage arrays
    merged.children[name].usage.push(...childData.usage);

    // Merge nested details if they exist
    if (childData.details) {
      merged.children[name].details = childData.details;
    }
  }

  return merged;
}

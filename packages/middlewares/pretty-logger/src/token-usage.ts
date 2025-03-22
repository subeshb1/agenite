import chalk from 'chalk';
import Table from 'cli-table3';

// Common table options
const getTableOptions = () => ({
  style: {
    'padding-left': 1,
    'padding-right': 1,
  },
  chars: {
    top: '═',
    'top-mid': '╤',
    'top-left': '╔',
    'top-right': '╗',
    bottom: '═',
    'bottom-mid': '╧',
    'bottom-left': '╚',
    'bottom-right': '╝',
    left: '║',
    'left-mid': '╟',
    mid: '─',
    'mid-mid': '┼',
    right: '║',
    'right-mid': '╢',
    middle: '│',
  },
});

// Helper to format a number with commas
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Helper to format cost with 6 decimal places
const formatCost = (cost: number): string => {
  return cost > 0 ? `$${cost.toFixed(6)}` : '';
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface TokenUsageSummary {
  modelBreakdown: Record<string, TokenUsage>;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

// Helper to print token usage summary
export const printTokenUsage = (tokenUsage: TokenUsageSummary | undefined) => {
  if (!tokenUsage?.modelBreakdown || typeof tokenUsage.modelBreakdown !== 'object') {
    return;
  }

  const models = Object.entries(tokenUsage.modelBreakdown);

  console.log('\n' + chalk.magenta.bold('📊 Token Usage Summary'));

  // Single model case - show model name in title
  if (models.length === 1) {
    console.log(
      chalk.gray(`Using model: `) + chalk.white.bold(models[0]?.[0] || '')
    );
  }

  // Create combined table
  const headers = ['Type', 'Input', 'Output', 'Total'];
  const usageTable = new Table({
    ...getTableOptions(),
    head: headers.map((h) => chalk.magenta.bold(h)),
    colWidths: [52, 16, 16, 16],
  });

  // Helper to format a row with both tokens and costs
  const formatRow = (
    type: string,
    usage: TokenUsage
  ) => {
    return [
      chalk.white(type),
      chalk.blue.bold(formatNumber(usage.inputTokens)) + 
        (usage.inputCost > 0 ? chalk.gray('\n') + chalk.blue(formatCost(usage.inputCost)) : ''),
      chalk.green.bold(formatNumber(usage.outputTokens)) + 
        (usage.outputCost > 0 ? chalk.gray('\n') + chalk.green(formatCost(usage.outputCost)) : ''),
      chalk.yellow.bold(formatNumber(usage.totalTokens)) + 
        (usage.totalCost > 0 ? chalk.gray('\n') + chalk.yellow(formatCost(usage.totalCost)) : ''),
    ];
  };

  // Add model rows if there are multiple models
  if (models.length > 1) {
    models.forEach(([model, usage]) => {
      usageTable.push(
        formatRow(`🤖 ${model}`, usage)
      );
    });
  }

  // Add total row at the bottom
  usageTable.push(
    formatRow('📊 Total', {
      inputTokens: tokenUsage.inputTokens,
      outputTokens: tokenUsage.outputTokens,
      totalTokens: tokenUsage.totalTokens,
      inputCost: tokenUsage.inputCost,
      outputCost: tokenUsage.outputCost,
      totalCost: tokenUsage.totalCost,
    })
  );

  // Apply colored borders and print table
  const tableStr = usageTable.toString();
  console.log(
    tableStr
      .split('\n')
      .map((line) => chalk.magenta(line))
      .join('\n')
  );
}; 

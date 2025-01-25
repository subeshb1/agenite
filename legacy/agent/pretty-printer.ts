import chalk from 'chalk';
import {
  BaseMessage,
  ExecutionStep,
  NestedExecutionMetadata,
  ToolResultExecutionBlock,
  TokenUsage,
  DetailedTokenUsage,
} from './types';

export interface PrettyPrintOptions {
  silent?: boolean;
  colors?: boolean;
  emojis?: boolean;
  compact?: boolean;
  stream?: boolean;
}

export class PrettyPrinter {
  private colors: boolean;
  private emojis: boolean;
  private compact: boolean;
  private currentStreamedText: string = '';
  private isStreaming: boolean = false;
  private stream: boolean;

  constructor(options: PrettyPrintOptions = {}) {
    this.colors = options.colors ?? true;
    this.emojis = options.emojis ?? true;
    this.compact = options.compact ?? false;
    this.stream = options.stream ?? false;
  }

  private emoji(name: string): string {
    if (!this.emojis) return '';
    const emojis: Record<string, string> = {
      agent: '🤖',
      user: '👤',
      tool: '🛠️',
      error: '💥',
      success: '✨',
      thinking: '💭',
      result: '🎯',
      toolStart: '⚡️',
      toolEnd: '🔧',
      warning: '⚠️',
      loading: '⚙️',
      data: '📊',
      input: '📥',
      output: '📤',
      tokens: '🔢',
    };
    return (emojis[name] || '') + ' ';
  }

  private separator(char = '─'): string {
    if (!this.colors) return `\n${char.repeat(50)}\n`;

    // More subtle separator with smaller decorative elements
    const edge = '•';
    const line = char.repeat(23);

    return '\n' + chalk.gray(`${edge}${line}${edge}${line}${edge}`) + '\n';
  }

  private clearLine(): void {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  }

  private formatDetailedTokenUsage(
    tokenUsage: DetailedTokenUsage,
    indent: string = '',
  ): string {
    if (
      !tokenUsage.completion.length &&
      Object.keys(tokenUsage.children).length === 0
    ) {
      return '';
    }

    const lines: string[] = [];

    // Total usage with improved colors for dark theme
    const totalLine = this.colors
      ? chalk.hex('#38BDF8')(`${indent}${this.emoji('tokens')}Total Tokens: `) +
        chalk.hex('#94A3B8')(
          `In: ${tokenUsage.total.inputTokens} | Out: ${tokenUsage.total.outputTokens} | Total: ${
            tokenUsage.total.inputTokens + tokenUsage.total.outputTokens
          }`,
        )
      : `${indent}${this.emoji('tokens')}Total Tokens: In: ${tokenUsage.total.inputTokens} | Out: ${tokenUsage.total.outputTokens} | Total: ${
          tokenUsage.total.inputTokens + tokenUsage.total.outputTokens
        }`;

    lines.push(totalLine);

    // Completion usage with improved visibility
    if (tokenUsage.completion.length > 0) {
      const models = [
        ...new Set(tokenUsage.completion.map((t) => t.modelId)),
      ].join(', ');
      const completionTotal = tokenUsage.completion.reduce(
        (acc, t) => ({
          input: acc.input + t.inputTokens,
          output: acc.output + t.outputTokens,
        }),
        { input: 0, output: 0 },
      );

      const completionLine = this.colors
        ? chalk.hex('#60A5FA')(`${indent}  Completion `) +
          chalk.hex('#94A3B8')(`(${models}): `) +
          chalk.hex('#CBD5E1')(
            `In: ${completionTotal.input} | Out: ${completionTotal.output} | Total: ${
              completionTotal.input + completionTotal.output
            }`,
          )
        : `${indent}  Completion (${models}): In: ${completionTotal.input} | Out: ${completionTotal.output} | Total: ${
            completionTotal.input + completionTotal.output
          }`;

      lines.push(completionLine);
    }

    // Child operations usage with improved contrast
    for (const [name, childData] of Object.entries(tokenUsage.children)) {
      const childTotal = childData.usage.reduce(
        (acc, t) => ({
          input: acc.input + t.inputTokens,
          output: acc.output + t.outputTokens,
        }),
        { input: 0, output: 0 },
      );

      const models = [...new Set(childData.usage.map((t) => t.modelId))].join(
        ', ',
      );

      const childLine = this.colors
        ? chalk.hex('#4ADE80')(`${indent}  ${name} `) +
          chalk.hex('#94A3B8')(`(${models}): `) +
          chalk.hex('#CBD5E1')(
            `In: ${childTotal.input} | Out: ${childTotal.output} | Total: ${
              childTotal.input + childTotal.output
            }`,
          )
        : `${indent}  ${name} (${models}): In: ${childTotal.input} | Out: ${childTotal.output} | Total: ${
            childTotal.input + childTotal.output
          }`;

      lines.push(childLine);

      // Recursively format nested details if they exist
      if (childData.details) {
        lines.push(
          this.formatDetailedTokenUsage(childData.details, `${indent}    `),
        );
      }
    }

    return lines.join('\n');
  }

  private formatTokenUsage(tokens: TokenUsage[] | DetailedTokenUsage): string {
    if (Array.isArray(tokens)) {
      // Handle simple token array as before
      if (!tokens.length) return '';

      const totalInput = tokens.reduce((sum, t) => sum + t.inputTokens, 0);
      const totalOutput = tokens.reduce((sum, t) => sum + t.outputTokens, 0);
      const total = totalInput + totalOutput;
      const models = [...new Set(tokens.map((t) => t.modelId))].join(', ');

      const tokenInfo = this.colors
        ? chalk.cyan(
            `${this.emoji('tokens')}Tokens: In: ${totalInput} | Out: ${totalOutput} | Total: ${total} | Model: ${models}`,
          )
        : `${this.emoji('tokens')}Tokens: In: ${totalInput} | Out: ${totalOutput} | Total: ${total} | Model: ${models}`;

      return `\n${tokenInfo}`;
    } else {
      // Handle detailed token usage
      return this.formatDetailedTokenUsage(tokens);
    }
  }

  printMessage(message: BaseMessage, step?: ExecutionStep): string {
    const roleStyles = {
      assistant: (text: string) => chalk.bgHex('#0EA5E9').white.bold(text),
      user: (text: string) => chalk.bgHex('#22C55E').white.bold(text),
      system: (text: string) => chalk.bgHex('#EAB308').black.bold(text),
    };

    const header = this.colors
      ? roleStyles[message.role](
          `${this.emoji(message.role === 'assistant' ? 'agent' : 'user')}${
            message.role === 'user' && step?.nestedExecution?.parentAgentName
              ? step.nestedExecution.parentAgentName
              : message.role.toUpperCase()
          }:`,
        )
      : `${this.emoji(message.role === 'assistant' ? 'agent' : 'user')}${
          message.role === 'user' && step?.nestedExecution?.parentAgentName
            ? step.nestedExecution.parentAgentName
            : message.role.toUpperCase()
        }:`;

    // Add subtle background to content
    const content = message.content
      .map((block) => {
        let text = '';
        if (typeof block === 'string') text = block;
        else if (block.type === 'text') text = block.text;
        else if (block.type === 'toolUse')
          text = `[Using tool: ${block.name}](${JSON.stringify(block.input)})`;
        else if (block.type === 'toolResult')
          text = `[Tool result: ${
            block.isError ? '❌ Error' : '✨ Success'
          }](${block.content})`;

        return this.colors ? chalk.bgRgb(30, 30, 30)(text) : text;
      })
      .join('\n');

    // Add token usage if available in the step
    const tokenUsage =
      step && 'tokenUsage' in step
        ? this.formatDetailedTokenUsage(step.tokenUsage)
        : '';

    return `${header}\n${content}${tokenUsage}`;
  }

  printToolResult(result: ToolResultExecutionBlock): string {
    const header = this.colors
      ? chalk
          .bgHex('#9333EA')
          .white.bold(
            `${this.emoji('toolEnd')}${result.type.toUpperCase()} RESULT (${result.result.toolName}):`,
          )
      : `${this.emoji('toolEnd')}${result.type.toUpperCase()} RESULT (${result.result.toolName}):`;

    const status = result.result.isError
      ? this.colors
        ? chalk.bgHex('#DC2626').white.bold(`${this.emoji('error')}Error`)
        : `${this.emoji('error')}Error`
      : this.colors
        ? chalk.bgHex('#059669').white.bold(`${this.emoji('success')}Success`)
        : `${this.emoji('success')}Success`;

    const content =
      typeof result.result.content === 'string'
        ? result.result.content
        : JSON.stringify(result.result.content, null, 2);

    const formattedContent = this.colors
      ? chalk.bgRgb(30, 30, 30)(`${this.emoji('output')}${content}`)
      : content;

    return `${header}\n${status}\n${formattedContent}`;
  }

  private getAgentChain(metadata?: NestedExecutionMetadata): string {
    if (!metadata?.executionPath?.length) {
      return metadata?.agentName
        ? `[${this.colors ? chalk.bold.cyan(metadata.agentName) : metadata.agentName}] `
        : '';
    }

    const arrow = this.colors ? chalk.hex('#666666')(' → ') : ' → ';
    const formattedChain = metadata.executionPath.map((name, index, array) => {
      if (index === array.length - 1) {
        // Active agent remains bold and cyan
        return this.colors ? chalk.bold.cyan(name) : name;
      }
      // Previous agents now use a more visible gray
      return this.colors ? chalk.hex('#8B8B8B')(name) : name;
    });

    return `[${formattedChain.join(arrow)}] `;
  }

  private printStep(step: ExecutionStep): string {
    const agentPrefix = this.getAgentChain(step.nestedExecution);

    switch (step.type) {
      case 'start': {
        const message = this.printMessage(step.message, step);
        return message
          .split('\n')
          .map((line) => `${agentPrefix}${line}`)
          .join('\n');
      }
      case 'streaming': {
        const newText = step.response.message.content
          .map((block) => {
            if (typeof block === 'string') return block;
            if (block.type === 'text') return block.text;
            return '';
          })
          .join('');

        if (!newText.trim()) {
          return '';
        }

        if (!this.isStreaming) {
          const header = this.colors
            ? chalk.bold.bgBlue.white(`${this.emoji('agent')}ASSISTANT:`)
            : `${this.emoji('agent')}ASSISTANT:`;

          return [`${agentPrefix}${header}`, `${agentPrefix}${newText}`].join(
            '\n',
          );
        }

        return newText;
      }
      case 'toolUse': {
        this.currentStreamedText = '';
        this.isStreaming = false;
        const toolHeader = this.colors
          ? chalk
              .bgHex('#0891B2')
              .white.bold(`${this.emoji('toolStart')}Using tool:`)
          : `${this.emoji('toolStart')}Using tool:`;

        // Only show token usage if not streaming
        const tokenUsage = !this.stream
          ? this.formatDetailedTokenUsage(step.tokenUsage)
          : '';

        return [
          `${agentPrefix}${toolHeader}`,
          step.tools
            .map((toolExecution) => {
              const toolType = this.colors
                ? chalk.hex('#94A3B8')(`(${toolExecution.type})`)
                : `(${toolExecution.type})`;

              const toolName = this.colors
                ? chalk.hex('#06B6D4')(toolExecution.tool.name)
                : toolExecution.tool.name;

              return `${agentPrefix}- ${toolName} ${toolType} ${this.emoji('loading')}\n${agentPrefix}  ${this.emoji('input')}Input: ${JSON.stringify(toolExecution.tool.input)}`;
            })
            .join('\n'),
          tokenUsage ? `${agentPrefix}${tokenUsage}` : '',
        ].join('\n');
      }
      case 'toolResult': {
        this.currentStreamedText = '';
        this.isStreaming = false;

        const results = step.results
          .filter((block) => block.type === 'tool' && block.result.content)
          .map((block) => {
            const result = this.printToolResult(block);
            return result
              .split('\n')
              .map((line) => `${agentPrefix}${line}`)
              .join('\n');
          })
          .join('\n');

        // Only show token usage if not streaming
        const tokenUsage = !this.stream
          ? this.formatDetailedTokenUsage(step.tokenUsage)
          : '';

        return results + (tokenUsage ? `\n\n${agentPrefix}${tokenUsage}` : '');
      }
      case 'stop': {
        this.currentStreamedText = '';
        this.isStreaming = false;

        // Updated summary header with better dark theme visibility
        const summaryHeader = this.colors
          ? chalk
              .hex('#F472B6')
              .bold(`${this.emoji('tokens')}Token Usage Summary`)
          : `${this.emoji('tokens')}Token Usage Summary`;

        const tokenSummary = this.formatDetailedTokenUsage(step.tokenUsage);

        // When streaming, only show token summary
        if (this.stream) {
          return [
            '',
            '', // Double space before summary
            `${agentPrefix}${summaryHeader}`,
            tokenSummary
              .split('\n')
              .map((line) => `${agentPrefix}${line}`)
              .join('\n'),
          ].join('\n');
        }

        // When not streaming, show full message and summary
        const message = this.printMessage(step.response.message);
        return [
          message
            .split('\n')
            .map((line) => `${agentPrefix}${line}`)
            .join('\n'),
          '',
          '', // Double space before summary
          `${agentPrefix}${summaryHeader}`,
          tokenSummary
            .split('\n')
            .map((line) => `${agentPrefix}${line}`)
            .join('\n'),
        ].join('\n');
      }
      default:
        return '';
    }
  }

  print(step: ExecutionStep): void {
    const output = this.printStep(step);

    if (!output) return;

    if (step.type === 'streaming') {
      if (this.isStreaming) {
        process.stdout.write(output);
      } else {
        console.log(this.separator());
        this.isStreaming = true;
        process.stdout.write(output);
      }
    } else if (
      !this.compact ||
      step.type === 'toolResult' ||
      step.type === 'start' ||
      (step.type === 'stop' && !this.stream)
    ) {
      console.log(this.separator());
      console.log(output);
      this.isStreaming = false;
    }
  }
}

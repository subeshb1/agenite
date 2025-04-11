import { BaseNextValue, StepContext } from '@agenite/agent';
import chalk from 'chalk';
import { AsyncGeneratorMiddleware } from '@agenite/agent';
import { printTokenUsage } from './token-usage';
import stripAnsi from 'strip-ansi';

// Box drawing characters for structured data
const boxChars = {
  light: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
  },
};

// Get terminal width with fallback
const getTerminalWidth = (): number => {
  const minWidth = 40; // Minimum width we'll support
  const defaultWidth = 80; // Default width if we can't detect
  const maxWidth = 120; // Maximum width we'll use

  try {
    const columns = process.stdout.columns || defaultWidth;
    return Math.max(minWidth, Math.min(columns, maxWidth));
  } catch {
    return defaultWidth;
  }
};

// Helper to create a box for structured data
const createStructuredBox = (
  text: string,
  color: chalk.ChalkFunction,
  prefix: string = ''
) => {
  const chars = boxChars.light;

  // Calculate available width
  const terminalWidth = getTerminalWidth();
  const prefixLength = stripAnsi(prefix).length;
  const availableWidth = terminalWidth - prefixLength - 4;
  const padding = 2;
  const contentWidth = availableWidth - padding * 2;

  // Word wrap function that preserves JSON structure
  const wordWrap = (line: string): string[] => {
    if (line.length <= contentWidth) return [line];

    // Special handling for JSON-like strings with indentation
    const isIndented = line.match(/^[\s\t]+/);
    const indentation = isIndented ? isIndented[0] : '';
    const indentLength = indentation.length;

    // Available width for content after indentation
    const actualWidth = contentWidth - indentLength;

    // Split long lines while preserving indentation
    const words = line.trim().split(' ');
    const wrappedLines: string[] = [];
    let currentLine = indentation;

    words.forEach((word) => {
      if (currentLine.length - indentLength + word.length + 1 <= actualWidth) {
        currentLine += (currentLine === indentation ? '' : ' ') + word;
      } else {
        wrappedLines.push(currentLine);
        currentLine = indentation + word;
      }
    });

    wrappedLines.push(currentLine);
    return wrappedLines;
  };

  // Split and wrap text
  const lines = text
    .split('\n')
    .map((line) => wordWrap(line))
    .flat();

  // Create the box
  const horizontalBorder = chars.horizontal.repeat(availableWidth);
  const top = `${prefix}${chars.topLeft}${horizontalBorder}${chars.topRight}`;
  const bottom = `${prefix}${chars.bottomLeft}${horizontalBorder}${chars.bottomRight}`;

  // Create content lines with padding
  const content = lines
    .map((line) => {
      // Ensure line doesn't exceed content width
      const truncatedLine =
        line.length > contentWidth
          ? line.slice(0, contentWidth - 3) + '...'
          : line;
      const paddedLine = truncatedLine.padEnd(contentWidth);
      return `${prefix}${color(chars.vertical)}${' '.repeat(padding)}${paddedLine}${' '.repeat(padding)}${color(chars.vertical)}`;
    })
    .join('\n');

  return `${color(top)}\n${content}\n${color(bottom)}`;
};

// Helper to get agent prefix
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAgentPrefix = (context: StepContext<any>): string => {
  // If no parent, return empty prefix
  if (!context?.parentExecution) {
    return '';
  }

  // If parent is supervisor or top-level, just show current agent
  if (!context.parentExecution.parentExecution) {
    return `${context.agent.agentConfig.name}> `;
  }

  // Otherwise show immediate parent and current agent
  return `${context.parentExecution.agent.agentConfig.name}> ${context.agent.agentConfig.name}> `;
};

// Helper to create visual separators
const createMainSeparator = () => {
  const width = getTerminalWidth() - 4;
  return chalk.gray(`◇${boxChars.light.horizontal.repeat(width - 3)}◇`);
};

const createSubSeparator = () => {
  const width = getTerminalWidth() - 4;
  return chalk.gray(`◇${boxChars.light.horizontal.repeat(width - 3)}◇`);
};

export const prettyLogger: () => AsyncGeneratorMiddleware = () => {
  return async function* (generator) {
    let result = await generator.next();
    let nextValue: BaseNextValue | undefined;
    let lastAgentPrefix: string | undefined;
    let lastContentType: string | undefined;
    let currentLine = '';

    // Track if we're currently in a streaming section
    let isStreamingSection = false;
    let currentStreamingColor: chalk.ChalkFunction | null = null;

    const startStreamingSection = (
      prefix: string,
      color: chalk.ChalkFunction
    ) => {
      const width = getTerminalWidth() - 4;
      const prefixLength = stripAnsi(prefix).length;
      const availableWidth = width - prefixLength;
      const chars = boxChars.light;
      console.log(
        color(
          `${prefix}${chars.topLeft}${chars.horizontal.repeat(availableWidth - 2)}${chars.topRight}`
        )
      );
      isStreamingSection = true;
      currentStreamingColor = color;
      currentLine = '';
      // Print initial line with just the border
      process.stdout.write(color(`${prefix}${chars.vertical} `));
    };

    const endStreamingSection = (
      prefix: string,
      color: chalk.ChalkFunction
    ) => {
      if (isStreamingSection) {
        const width = getTerminalWidth() - 4;
        const prefixLength = stripAnsi(prefix).length;
        const availableWidth = width - prefixLength;
        const chars = boxChars.light;

        // Complete the current line if any
        if (currentLine.length > 0) {
          const contentWidth = availableWidth - 4; // 4 for borders and padding
          process.stdout.write(
            ' '.repeat(
              Math.max(0, contentWidth - stripAnsi(currentLine).length)
            )
          );
          process.stdout.write(color(` ${chars.vertical}\n`));
        }

        console.log(
          color(
            `${prefix}${chars.bottomLeft}${chars.horizontal.repeat(availableWidth - 2)}${chars.bottomRight}`
          )
        );
        isStreamingSection = false;
        currentStreamingColor = null;
        currentLine = '';
      }
    };

    const writeStreamingContent = (
      prefix: string,
      content: string,
      color: chalk.ChalkFunction
    ) => {
      const chars = boxChars.light;
      const width = getTerminalWidth() - 4;
      const prefixLength = stripAnsi(prefix).length;
      const availableWidth = width - prefixLength;
      const contentWidth = availableWidth - 4; // 4 for borders and padding

      for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (char === '\n') {
          // Complete current line
          const padding = ' '.repeat(
            Math.max(0, contentWidth - stripAnsi(currentLine).length)
          );
          process.stdout.write(padding);
          process.stdout.write(color(` ${chars.vertical}\n`));

          // Start new line
          process.stdout.write(color(`${prefix}${chars.vertical} `));
          currentLine = '';
        } else {
          currentLine += char;
          process.stdout.write(color(char));

          // Check if we need to wrap
          if (stripAnsi(currentLine).length >= contentWidth) {
            process.stdout.write(color(` ${chars.vertical}\n`));
            process.stdout.write(color(`${prefix}${chars.vertical} `));
            currentLine = '';
          }
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addSeparation = (contentType: string, context: StepContext<any>) => {
      const isMainAgent = !context?.parentExecution;
      const isDifferentAgent = lastAgentPrefix !== getAgentPrefix(context);
      const isNewContentType = lastContentType !== contentType;

      if (isDifferentAgent || (isMainAgent && isNewContentType)) {
        console.log('\n' + createMainSeparator() + '\n');
      } else if (isNewContentType) {
        console.log('\n' + createSubSeparator() + '\n');
      }

      lastAgentPrefix = getAgentPrefix(context);
      lastContentType = contentType;
    };

    while (!result.done) {
      switch (result.value.type) {
        case 'agenite.llm-call.streaming':
          if (result.value.content.type === 'thinking') {
            const prefix = getAgentPrefix(result.value.executionContext);
            if (result.value.content.isStart) {
              addSeparation('thinking', result.value.executionContext);
              console.log(
                chalk.yellow.bold(
                  `${prefix}🧠 Thinking [${result.value.executionContext.agent.agentConfig.name}]`
                )
              );
              startStreamingSection(prefix, chalk.yellow);
            }
            if (result.value.content.thinking) {
              writeStreamingContent(
                prefix,
                result.value.content.thinking,
                chalk.yellow
              );
            }
            if (result.value.content.isEnd) {
              endStreamingSection(prefix, chalk.yellow);
            }
          } else if (result.value.content.type === 'text') {
            const prefix = getAgentPrefix(result.value.executionContext);
            if (result.value.content.isStart) {
              addSeparation('response', result.value.executionContext);
              console.log(
                chalk.green.bold(
                  `${prefix}💡 Agent response [${result.value.executionContext.agent.agentConfig.name}]`
                )
              );
              startStreamingSection(prefix, chalk.green);
            }
            if (result.value.content.text) {
              writeStreamingContent(
                prefix,
                result.value.content.text,
                chalk.green
              );
            }
            if (result.value.content.isEnd) {
              endStreamingSection(prefix, chalk.green);
            }
          } else if (result.value.content.type === 'toolUse') {
            const prefix = getAgentPrefix(result.value.executionContext);
            if (isStreamingSection) {
              endStreamingSection(prefix, currentStreamingColor || chalk.white);
            }
            addSeparation('tool', result.value.executionContext);
            const toolContent = result.value.content.toolUse;
            console.log(
              chalk.cyan.bold(`${prefix}⚙️  Tool use: [${toolContent?.name}]`)
            );
            console.log(
              createStructuredBox(
                JSON.stringify(toolContent?.input, null, 2),
                chalk.cyan,
                prefix
              )
            );
          }
          break;
        case 'agenite.llm-call.input':
          {
            const inputPrefix = getAgentPrefix(result.value.executionContext);
            const messages = result.value.content.messages;
            const lastMessage = messages[messages.length - 1];
            if (lastMessage) {
              const isUserMessage = lastMessage.role === 'user';
              const isMainAgent =
                !result.value.executionContext?.parentExecution;
              const hasToolResult = lastMessage.content.some(
                (block) =>
                  typeof block === 'object' && block.type === 'toolResult'
              );

              if (!hasToolResult) {
                addSeparation('input', result.value.executionContext);
                const label =
                  isMainAgent && isUserMessage
                    ? '👤 User input'
                    : '🤖 Parent agent instruction';

                const content = lastMessage.content
                  .map((block) =>
                    typeof block === 'string'
                      ? block
                      : block.type === 'text'
                        ? block.text
                        : ''
                  )
                  .join('');

                console.log(chalk.blue.bold(`${inputPrefix}${label}`));
                console.log(
                  createStructuredBox(content, chalk.blue, inputPrefix)
                );
              }
            }
          }
          break;
        case 'agenite.tool-result':
          {
            const prefix = getAgentPrefix(result.value.executionContext);
            addSeparation('tool-result', result.value.executionContext);
            const toolName = result.value.toolUseBlock.name;

            const isError =
              result.value.result &&
              typeof result.value.result === 'object' &&
              'error' in result.value.result;
            console.log(
              (isError ? chalk.red : chalk.green).bold(
                `${prefix}${isError ? '❌' : '✅'}  Result: [${toolName || 'Tool'}]`
              )
            );
            console.log(
              createStructuredBox(
                typeof result.value.result.data === 'object'
                  ? JSON.stringify(result.value.result.data, null, 2)
                  : result.value.result.data,
                chalk.cyan,
                prefix
              )
            );
          }
          break;
        default:
          break;
      }
      nextValue = yield result.value;

      result = await generator.next(nextValue);
    }

    console.log('\n' + createMainSeparator() + '\n');
    // Print token usage summary at the end
    printTokenUsage(result.value?.tokenUsage);

    return result.value;
  };
};

import type {
  BaseMessage,
  ContentBlock,
  GenerateResponse,
  StopReason,
  ToolDefinition,
  ToolUseBlock,
  ToolResultBlock,
} from '@agenite/llm';
import type { Tool } from 'ollama';
import type {
  OllamaMessage,
  ToolParameterValue,
  OllamaToolCall,
} from './types';

/**
 * Creates token information for a response
 */
function createTokenInfo(
  modelId: string,
  inputTokens: number = 0,
  outputTokens: number = 0
) {
  return [
    {
      inputTokens,
      outputTokens,
      modelId,
    },
  ];
}

/**
 * Creates a response object with common metadata
 */
export function createResponse(
  content: ContentBlock[],
  startTime: number,
  modelId: string,
  inputTokens: number = 0,
  outputTokens: number = 0,
  stopReason?: StopReason
): GenerateResponse {
  return {
    content,
    tokens: createTokenInfo(modelId, inputTokens, outputTokens),
    duration: Date.now() - startTime,
    stopReason,
  };
}

/**
 * Creates a text content block
 */
export function createTextContent(text: string): ContentBlock {
  return { type: 'text', text };
}

/**
 * Creates a tool use content block
 */
export function createToolUseContent(
  name: string,
  input: Record<string, unknown>
): ToolUseBlock {
  return {
    type: 'toolUse',
    id: crypto.randomUUID(),
    name,
    input,
  };
}

/**
 * Parses tool arguments from string or record
 */
function parseToolArguments(
  args: string | Record<string, unknown>
): Record<string, unknown> {
  return typeof args === 'string' ? JSON.parse(args) : args;
}

/**
 * Converts Ollama's function calls to our tool use format
 */
export function convertFunctionCallsToToolUses(
  toolCalls: OllamaToolCall[]
): ContentBlock[] {
  return toolCalls.map((toolCall) =>
    createToolUseContent(
      toolCall.function.name,
      parseToolArguments(toolCall.function.arguments)
    )
  );
}

/**
 * Maps Ollama finish reasons to our standard stop reasons
 */
export function mapStopReason(
  finishReason: string | null
): StopReason | undefined {
  if (!finishReason) return undefined;

  const stopReasonMap: Record<string, StopReason> = {
    stop: 'endTurn',
    length: 'maxTokens',
    tool_calls: 'toolUse',
  };

  return stopReasonMap[finishReason] || undefined;
}

/**
 * Extracts text content from message blocks
 */
export function extractTextContent(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim();
}

/**
 * Extracts base64 images from message blocks
 */
export function extractImages(blocks: ContentBlock[]): string[] {
  return blocks
    .map((block) => {
      if (block.type === 'image' && block.source.type === 'base64') {
        return block.source.data;
      }
      return null;
    })
    .filter((img): img is string => img !== null);
}

/**
 * Creates a tool use message in Ollama's format
 */
function createToolUseMessage(toolUse: ToolUseBlock): OllamaMessage {
  return {
    role: 'assistant',
    content: '',
    tool_calls: [
      {
        function: {
          name: toolUse.name,
          arguments: toolUse.input as Record<string, unknown>,
        },
      },
    ],
  };
}

/**
 * Creates a tool result message in Ollama's format
 */
function createToolResultMessage(toolResult: ToolResultBlock): OllamaMessage {
  return {
    role: 'tool',
    content: JSON.stringify(toolResult.content),
    name: toolResult.toolName,
  };
}

/**
 * Creates a regular message in Ollama's format
 */
function createRegularMessage(msg: BaseMessage): OllamaMessage {
  const images = extractImages(msg.content);
  const content = extractTextContent(msg.content);

  return {
    role: msg.role,
    content,
    ...(images.length > 0 && { images }),
  };
}

/**
 * Finds a tool result for a given tool use
 */
function findToolResult(
  toolUse: ToolUseBlock,
  nextMsg?: BaseMessage
): ToolResultBlock | undefined {
  return nextMsg?.content.find(
    (block): block is ToolResultBlock =>
      block.type === 'toolResult' && block.toolUseId === toolUse.id
  );
}

/**
 * Processes a message pair (current and next) into Ollama messages
 */
function processMessagePair(
  msg: BaseMessage,
  nextMsg?: BaseMessage
): {
  messages: OllamaMessage[];
  skipNext: boolean;
} {
  const toolUses = msg.content.filter(
    (block): block is ToolUseBlock => block.type === 'toolUse'
  );

  if (!toolUses.length) {
    return {
      messages: [createRegularMessage(msg)],
      skipNext: false,
    };
  }

  // Create a single message with all tool calls
  const toolCallsMessage: OllamaMessage = {
    role: 'assistant',
    content: '',
    tool_calls: toolUses.map((toolUse) => ({
      function: {
        name: toolUse.name,
        arguments: toolUse.input as Record<string, unknown>,
      },
    })),
  };

  const messages: OllamaMessage[] = [toolCallsMessage];

  // Add individual tool results if they exist
  for (const toolUse of toolUses) {
    const toolResult = findToolResult(toolUse, nextMsg);
    if (toolResult) {
      messages.push(createToolResultMessage(toolResult));
    }
  }

  // Skip next message if we found at least one tool result
  const hasToolResults = messages.some((msg) => msg.role === 'tool');
  return { messages, skipNext: hasToolResults };
}

/**
 * Converts our message format to Ollama's format
 */
export function convertMessages(messages: BaseMessage[]): OllamaMessage[] {
  const ollamaMessages: OllamaMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg) continue;

    const { messages: newMessages, skipNext } = processMessagePair(
      msg,
      messages[i + 1]
    );
    ollamaMessages.push(...newMessages);

    if (skipNext) {
      i++; // Skip the next message since we've handled it
    }
  }

  return ollamaMessages;
}

/**
 * Extracts type information from a tool parameter
 */
function extractParameterType(value: unknown): string {
  return typeof value === 'object' && value && 'type' in value
    ? String(value.type)
    : 'string';
}

/**
 * Extracts description from a tool parameter
 */
function extractParameterDescription(value: unknown, key: string): string {
  return typeof value === 'object' && value && 'description' in value
    ? String(value.description)
    : key;
}

/**
 * Extracts enum values from a tool parameter if they exist
 */
function extractParameterEnum(value: unknown): { enum?: string[] } {
  return typeof value === 'object' && value && 'enum' in value
    ? { enum: (value as ToolParameterValue).enum }
    : {};
}

/**
 * Converts a single parameter definition to Ollama's format
 */
function convertParameterDefinition(key: string, value: unknown) {
  return [
    key,
    {
      type: extractParameterType(value),
      description: extractParameterDescription(value, key),
      ...extractParameterEnum(value),
    },
  ];
}

/**
 * Converts tool parameters to Ollama's format
 */
function convertToolParameters(tool: ToolDefinition) {
  return {
    type: 'object',
    properties: Object.fromEntries(
      Object.entries(tool.parameters.properties).map(([key, value]) =>
        convertParameterDefinition(key, value)
      )
    ),
    required: tool.parameters.required ?? [],
  };
}

/**
 * Converts a single tool definition to Ollama's format
 */
function convertToolDefinition(tool: ToolDefinition): Tool {
  return {
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: convertToolParameters(tool),
    },
  };
}

/**
 * Converts tool definitions to Ollama's format
 */
export function convertToolDefinitions(
  tools?: ToolDefinition[]
): Tool[] | undefined {
  if (!tools?.length) return undefined;
  return tools.map(convertToolDefinition);
}

/**
 * Creates error with consistent format
 */
export function createError(error: unknown, context: string): Error {
  console.error(`Ollama ${context} failed:`, error);
  return error instanceof Error
    ? new Error(`Ollama ${context} failed: ${error.message}`)
    : new Error(`Ollama ${context} failed with unknown error`);
}

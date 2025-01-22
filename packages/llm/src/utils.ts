import type {
  BaseMessage,
  GenerateOptions,
  IterateGenerateOptions,
  LLMProvider,
  GenerateResponse,
  PartialReturn,
} from './types';

/**
 * Converts a string message to BaseMessage array
 */
export function convertStringToMessages(
  message: string | BaseMessage[]
): BaseMessage[] {
  if (typeof message === 'string') {
    return [
      {
        role: 'user',
        content: [{ type: 'text', text: message }],
      },
    ];
  }

  return message;
}

/**
 * Base implementation of iterate using generate and stream
 */
export async function* iterateFromMethods(
  provider: LLMProvider,
  input: string | BaseMessage[],
  options: IterateGenerateOptions
): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
  const { stream } = options;

  if (stream) {
    // For streaming, use the stream method and yield each chunk
    const streamGen = provider.stream(input, options);

    return yield* streamGen;
  } else {
    // For non-streaming, use generate and return the response
    return await provider.generate(input, options);
  }
}

/**
 * Base class for LLM providers that implements iterate using generate and stream
 */
export abstract class BaseLLMProvider implements LLMProvider {
  abstract name: string;
  abstract version?: string;

  abstract generate(
    input: string,
    options?: Partial<GenerateOptions>
  ): Promise<GenerateResponse>;

  abstract stream(
    input: string,
    options?: Partial<GenerateOptions>
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown>;

  async *iterate(
    input: string | BaseMessage[],
    options: IterateGenerateOptions
  ): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
    return yield* iterateFromMethods(this, input, options);
  }
}

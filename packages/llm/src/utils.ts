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
export function convertStringToMessages(message: string): BaseMessage[] {
  return [
    {
      role: 'user',
      content: [{ type: 'text', text: message }],
    },
  ];
}

/**
 * Base implementation of generate using iterate
 */
export async function generateFromIterate(
  provider: LLMProvider,
  input: string,
  options?: Partial<GenerateOptions>
): Promise<GenerateResponse> {
  const fullOptions: IterateGenerateOptions = {
    ...options,
    stream: false,
  };

  const iterator = provider.iterate(input, fullOptions);
  let response = await iterator.next();
  
  while (!response.done) {
    response = await iterator.next();
  }

  if (!response.value) {
    throw new Error('No response received');
  }

  return response.value;
}

/**
 * Base implementation of stream using iterate
 */
export async function* streamFromIterate(
  provider: LLMProvider,
  input: string,
  options?: Partial<GenerateOptions>
): AsyncGenerator<PartialReturn, GenerateResponse, unknown> {
  const fullOptions: IterateGenerateOptions = {
    ...options,
    stream: true,
  };

  const iterator = provider.iterate(input, fullOptions);
  let result = await iterator.next();
  
  while (!result.done) {
    const part = result.value;
    if (part.type === 'partial') {
      yield part;
    }
    result = await iterator.next();
  }

  return result.value;
}

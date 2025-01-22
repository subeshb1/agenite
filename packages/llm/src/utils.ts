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
    const streamGen = provider.stream(
      typeof input === 'string' ? input : JSON.stringify(input),
      options
    );
    
    let result = await streamGen.next();
    while (!result.done) {
      yield result.value;
      result = await streamGen.next();
    }
    
    return result.value;
  } else {
    // For non-streaming, use generate and return the response
    return await provider.generate(
      typeof input === 'string' ? input : JSON.stringify(input),
      options
    );
  }
}

export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  role: Role;
  content: string;
}

export interface AIResponse {
  content: string;
  isComplete: boolean;
  metadata?: {
    provider: string;
    model: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export interface StreamingOptions {
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export interface BaseGenerateOptions extends StreamingOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  generateResponse(
    messages: Message[],
    options?: BaseGenerateOptions
  ): AsyncGenerator<AIResponse>;
} 

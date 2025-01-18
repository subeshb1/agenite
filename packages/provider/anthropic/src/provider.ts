import Anthropic from "@anthropic-ai/sdk";
import {
  type LLMProvider,
  type Message,
  type BaseGenerateOptions,
  type AIResponse,
} from "@agenite/llm-core";
import { type AnthropicConfig } from "./types";

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model ?? "claude-3-opus-20240229";
  }

  async *generateResponse(
    messages: Message[],
    options: BaseGenerateOptions = {},
  ): AsyncGenerator<AIResponse> {
    const stream = await this.client.messages.create({
      model: this.model,
      messages: messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
      stream: true,
    });

    let accumulatedContent = "";

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta") {
        const content = chunk.delta.text;
        accumulatedContent += content;

        if (options.onToken) {
          options.onToken(content);
        }

        yield {
          content: accumulatedContent,
          isComplete: false,
          metadata: {
            provider: "anthropic",
            model: this.model,
          },
        };
      }
    }

    yield {
      content: accumulatedContent,
      isComplete: true,
      metadata: {
        provider: "anthropic",
        model: this.model,
      },
    };
  }
}

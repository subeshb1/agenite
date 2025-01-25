export interface BaseMessage {
  role: 'user' | 'assistant' | 'system';
  content: ContentBlock[];
}

export type ContentBlock =
  | TextBlock
  | ImageBlock
  | ToolUseBlock
  | ToolResultBlock
  | string;

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ImageBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
}

export interface ToolUseBlock {
  type: 'toolUse';
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResultBlock {
  type: 'toolResult';
  toolUseId: string;
  toolName: string;
  content?: string | Array<TextBlock | ImageBlock>;
  isError?: boolean;
}

import { BaseMessage, ToolResultBlock, ToolUseBlock } from '../types';

export const userTextMessage = (message: string): BaseMessage => {
  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
  };
};
export const assistantTextMessage = (message: string): BaseMessage => {
  return {
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
  };
};

export const toolUseMessage = (toolUse: ToolUseBlock): BaseMessage => {
  return {
    role: 'assistant',
    content: [toolUse],
  };
};

export const toolResultMessage = (toolResult: ToolResultBlock): BaseMessage => {
  return {
    role: 'user',
    content: [toolResult],
  };
};

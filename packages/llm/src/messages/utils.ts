import { BaseMessage } from '../types';

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

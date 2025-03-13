import { BaseMessage } from '@agenite/llm';

export type StateFromReducer<
  Reducer extends StateReducer<Record<string, any>>,
> = {
  [K in keyof Reducer]: ReturnType<Reducer[K]>;
} & {
  messages: BaseMessage[];
};

export type StateReducer<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  [K in keyof T]: (newValue?: T[K], previousValue?: T[K]) => T[K];
} & {
  messages: (
    newValue?: BaseMessage[],
    previousValue?: BaseMessage[]
  ) => BaseMessage[];
};

export const defaultStateReducer: StateReducer<{
  messages: BaseMessage[];
}> = {
  messages: (newValue?: BaseMessage[], previousValue?: BaseMessage[]) => {
    if (!newValue) {
      return previousValue || [];
    }
    return [...(previousValue || []), ...newValue];
  },
};

export const customStateReducer: StateReducer<{
  /** Magic number */
  a?: number;
}> = {
  messages: (newValue?: BaseMessage[], previousValue?: BaseMessage[]) => {
    if (!newValue) {
      return previousValue || [];
    }
    return [...(previousValue || []), ...newValue];
  },
};

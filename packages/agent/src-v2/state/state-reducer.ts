import { BaseMessage } from '@agenite/llm';

/**
 * Currently. If there is a state, there must be a reducer for it.
 * If there is no reducer, the state will not be updated.
 *
 * In the future, we can add a default reducer that does nothing.
 * Then, we can add a flag to the state reducer to indicate that the state is optional.
 */

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
  [K in keyof T]-?: (newValue?: T[K], previousValue?: T[K]) => T[K];
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
  a: (newValue?: number, previousValue?: number) => {
    return newValue || previousValue || 0;
  },
};

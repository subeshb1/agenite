import { StateFromReducer, StateReducer } from './state-reducer';

export const stateApplicator = <
  Reducer extends StateReducer<Record<string, any>>,
>(
  stateReducer: Reducer,
  previousState: StateFromReducer<Reducer>,
  newState: Partial<StateFromReducer<Reducer>>
): StateFromReducer<Reducer> => {
  // Start with a copy of previous state to ensure required fields are preserved
  const updatedState: StateFromReducer<Reducer> = {
    ...previousState,
    messages: previousState.messages || [], // Ensure messages is always present
  };

  // Iterate through all keys in newState
  for (const key in newState) {
    // If there's a reducer for this key, use it
    if (key in stateReducer) {
      updatedState[key] =
        stateReducer[key as keyof Reducer]?.(
          newState[key],
          previousState[key]
        ) || previousState[key];
    } else {
      // If no reducer, only override if new value exists
      if (newState[key] !== undefined) {
        updatedState[key] = newState[key];
      }
    }
  }

  return updatedState;
};

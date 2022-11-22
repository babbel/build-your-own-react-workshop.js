let globalHooksReplacer = {};

export const useState = (...args) => globalHooksReplacer.useState(...args);

const isStatesDiffer = (prev, next) => {
  if (typeof next === 'object') {
    return JSON.stringify(prev) !== JSON.stringify(next);
  }

  return prev !== next;
};

const createMakeUseState =
  (onUpdate, hooksMap) => (VDOMPointer, isFirstRender) => {
    // START HERE
    // Think about where you want to store the state so that it can be retrieved
    // during the renders?
    return initialState => {
      // In React, initialState can be a function for lazy state initilisation
      // So to handle that, we should call the initialState if it's a function
      const computedInitialState =
        typeof initialState === 'function' ? initialState() : initialState;
      if (isFirstRender) {
        const setState = newStateOrCb => {
          const newStateFn =
            typeof newStateOrCb === 'function'
              ? newStateOrCb
              : () => newStateOrCb;
          // DON'T FORGET
          // We will need the previous state to calculate the next state
          // if the developer used the callback style of setState
          const currentState = newStateFn(previousState);
          // DON'T FORGET
          // We need to store the currentState
          // So that it can be returned in the future render
          // And we need to re-render after a state update
        };
      }
      return [computedInitialState, () => {}];
    };
  };

const makeRegisterHooks =
  (hooksMap, makeUseState) => (VDOMPointer, isFirstRender) => {
    if (isFirstRender) {
      hooksMap[VDOMPointer] = {};
    }
    const useState = makeUseState(VDOMPointer, isFirstRender);
    globalHooksReplacer.useState = useState;
  };

export const createHooks = (onUpdate) => {
  const hooksMap = {};
  const hooks = { current: null };
  const boundOnUpdate = () => onUpdate(hooks.current);
  const makeUseState = createMakeUseState(boundOnUpdate, hooksMap);
  const registerHooks = makeRegisterHooks(
    hooksMap,
    makeUseState,
  );
  hooks.current = { registerHooks };
  return hooks.current;
};

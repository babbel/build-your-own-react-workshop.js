import { vdomPointerKeyToVDOMPointerArray } from './vdom-helpers';

let globalHooksReplacer = {};

export const useState = (...args) => globalHooksReplacer.useState(...args);

// compares state changes between updates
const isStatesDiffer = (prev, next) => {
  if (typeof next === 'object') {
    return JSON.stringify(prev) !== JSON.stringify(next);
  }

  return prev !== next;
};

// Creates the unique useState for each component element.
// onUpdate should be called after state update to re-render the DOM.
// hooksMap contains each hook in relation to its VDOM pointer.
// VDOMPointer is specific per component.
const createMakeUseState =
  (onUpdate, hooksMap) => (VDOMPointer, isFirstRender) => {
    let stateIndexRef = { current: 0 };
    let currentHook = hooksMap[VDOMPointer];
    if (isFirstRender) {
      currentHook.state = [];
    }

    // this is what gets called in the React component when you use useState()
    return initialState => {
      const stateIndex = stateIndexRef.current;
      stateIndexRef.current += 1;
      if (isFirstRender) {
        // In React, initialState can be a function for lazy state initilisation
        // So to handle that, we should call the initialState if it's a function
        const computedInitialState =
          typeof initialState === 'function' ? initialState() : initialState;

        const setState = newStateOrCb => {
          const newStateFn =
            typeof newStateOrCb === 'function'
              ? newStateOrCb
              : () => newStateOrCb;

          const ownState = currentHook.state[stateIndex];
          const previousState = ownState[0];
          const newState = newStateFn(previousState);
          const shouldUpdateState = isStatesDiffer(previousState, newState);

          if (shouldUpdateState) {
            ownState[0] = newState;
            onUpdate();
          }
        };

        currentHook.state[stateIndex] = [computedInitialState, setState];
      }

      return currentHook.state[stateIndex];
    };
  };

// Higher-Order Function that replaces hooks so they know which component
// they relate to (at the specified VDOMPointer)
const makeRegisterHooks =
  (hooksMap, makeUseState) => (VDOMPointer, isFirstRender) => {
    if (isFirstRender) {
      hooksMap[VDOMPointer] = {};
    }
    const useState = makeUseState(VDOMPointer, isFirstRender);
    globalHooksReplacer.useState = useState;
  };

export const createHooks = onUpdate => {
  // hooksMap[[0,0,0]] is the hooks for the component with VDOMPointer [0, 0, 0]
  // Each value (hook) e.g. hooksMap[[0,0,0]] has the following structure { state: [], effect: []}
  const hooksMap = {};
  const hooks = { current: null };
  const boundOnUpdate = () => onUpdate(hooks.current);
  const makeUseState = createMakeUseState(boundOnUpdate, hooksMap);
  const registerHooks = makeRegisterHooks(hooksMap, makeUseState);
  hooks.current = { registerHooks };
  return hooks.current;
};

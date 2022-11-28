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
    let currentHook = hooksMap[VDOMPointer];
    // START HERE
    // Here we now need to know which state we are trying to take care of.
    // The way React keeps track of those state is by order of calls in
    // the component, so we should keep track of the index of each useState.
    // For example with a component like this:
    /*
      const ComponentWithTwoStates = () => {
        const [counter, setCounter] = useState(0);
        const [userHasClicked, setUserHasClicked] = useState(false);
      }

      we would want to keep two states, at the first index the counter state
      at the second index, the userHasClicked.
      NB: their identification within this function is purely based on their index
      */
    // this is what gets called in the React component when you use useState()
    return initialState => {
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
          const ownState = currentHook.state;
          const previousState = ownState[0];
          const newState = newStateFn(previousState);
          const shouldUpdateState = isStatesDiffer(previousState, newState);

          if (shouldUpdateState) {
            ownState[0] = newState;
            onUpdate();
          }
        };
        currentHook.state = [computedInitialState, setState];
      }
      return currentHook.state;
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

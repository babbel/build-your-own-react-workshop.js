import { vdomPointerKeyToVDOMPointerArray } from './vdom-helpers';

let globalHooksReplacer = {};

export const useState = (...args) => globalHooksReplacer.useState(...args);
// DON'T FORGET
// replace below with correct code
export const useEffect = () => {};

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

const areDependenciesEqual = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.every((element, index) => element === b[index]);

const createMakeUseEffect = (registerOnUpdatedCallback, hooksMap) => {
  // Here we keep a combined callback reference that is the
  // function we want to call after a render cycle
  const combinedCallbackRef = { current: () => {} };
  // After every update, we will call that callback
  // and then reset it so the effects are ran just once
  registerOnUpdatedCallback(() => {
    combinedCallbackRef.current();
    combinedCallbackRef.current = () => {};
  });
  // This is a utility function that allows you to set a
  // callback to be ran after the next render
  const registerEffectForNextRender = callback => {
    const { current } = combinedCallbackRef;
    // it updates the combined callback reference
    // to call itself first (so it calls all the previously registered callbacks)
    // and then calls the newly registered one
    combinedCallbackRef.current = () => {
      current();
      callback();
    };
  };

  return (VDOMPointer, isFirstRender) => {
    // DON'T FORGET FOR AFTER THE EFFECT RUNNING ON EVERY UPDATE
    // How similar is useEffect to useState in the way they work?
    const currentHook = hooksMap[VDOMPointer];

    // At this point within this function, we are creating the function
    // that answers to `useEffect` calls within our components.
    // The first argument is the effect callback that the developer wants to run after the render.
    // The second argument is the dependencies array which should be used to determine whether the effect
    // should run or not in re-renders.
    return (effectCallback, dependencies) => {
      // DON'T FORGET FOR AFTER THE EFFECT RUNNING ON EVERY UPDATE
      // With this code, the effect will be run on every render update
      // how can we make sure it only runs when the dependencies were updated?
      // ps: we created for you a areDependenciesEqual function, so you can compare dependencies with
      // areDependenciesEqual(previousDependencies, currentDependencies)
      registerEffectForNextRender(() => {
        effectCallback();
      });
    };
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
    // START HERE
    // We will need to register useEffect so it works for our components
    // Maybe you can take inspiration from the way we developed useState?
  };

export const createHooks = (onUpdate, registerOnUpdatedCallback) => {
  // hooksMap[[0,0,0]] is the hooks for the component with VDOMPointer [0, 0, 0]
  // Each value (hook) e.g. hooksMap[[0,0,0]] has the following structure { state: [], effect: []}
  const hooksMap = {};
  const hooks = { current: null };
  const boundOnUpdate = () => onUpdate(hooks.current);
  const makeUseState = createMakeUseState(boundOnUpdate, hooksMap);
  const makeUseEffect = createMakeUseEffect(
    registerOnUpdatedCallback,
    hooksMap,
  );
  const registerHooks = makeRegisterHooks(hooksMap, makeUseState);
  hooks.current = { registerHooks };
  return hooks.current;
};

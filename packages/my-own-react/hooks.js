import { vdomPointerKeyToVDOMPointerArray } from './vdom-helpers';

let globalHooksReplacer = {};

export const useState = (...args) => globalHooksReplacer.useState(...args);
// DON'T FORGET
// useEffect will need to be made available globally

const isStatesDiffer = (prev, next) => {
  if (typeof next === 'object') {
    return JSON.stringify(prev) !== JSON.stringify(next);
  }

  return prev !== next;
};

const createMakeUseState =
  (onUpdate, hooksMap) => (VDOMPointer, isFirstRender) => {
    let stateIndexRef = { current: 0 };
    let hooksMapPointer = hooksMap[VDOMPointer];
    if (isFirstRender) {
      hooksMapPointer.state = [];
    }
    return initialState => {
      const stateIndex = stateIndexRef.current;
      stateIndexRef.current += 1;
      if (isFirstRender) {
        const computedInitialState =
          typeof initialState === 'function' ? initialState() : initialState;
        const setState = newStateOrCb => {
          const newStateFn =
            typeof newStateOrCb === 'function'
              ? newStateOrCb
              : () => newStateOrCb;

          const ownState = hooksMapPointer.state[stateIndex];
          const previousState = ownState[0];
          const currentState = newStateFn(previousState);
          const shouldUpdateState = isStatesDiffer(previousState, currentState);

          if (shouldUpdateState) {
            ownState[0] = currentState;
            onUpdate();
          }
        };

        hooksMapPointer.state[stateIndex] = [computedInitialState, setState];
      }

      return hooksMapPointer.state[stateIndex];
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
    // to call itself first (so call all the previously registered callbacks)
    // and then call the newly registered one
    combinedCallbackRef.current = () => {
      current();
      callback();
    };
  };
  return (VDOMPointer, isFirstRender) => {
    // DON'T FORGET FOR AFTER THE EFFECT RUNNING ON EVERY UPDATE
    // How similar is useEffect to useState in the way they work?
    const hooksMapPointer = hooksMap[VDOMPointer];

    // At this point within this function, we are creating the function
    // that answers to `useEffect` calls within our components.
    // The first argument is the effect callback that the developer wants to run after the render.
    // The second argument is the dependencies array which should be used to determine whether the effect
    // should run or not in re-renders.
    return (effectCallback, dependencies) => {
      // DON'T FORGET FOR AFTER THE EFFECT RUNNING ON EVERY UPDATE
      // With this code, the effect will be run on every render update
      // how can we make sure it only runs when the dependencies were updated?
      // ps: we created for you a areDependenciesEqual function
      registerEffectForNextRender(() => {
        effectCallback();
      });
    };
  };
};

const makeRegisterHooks =
  (hooksMap, makeUseState) => (VDOMPointer, isFirstRender) => {
    if (isFirstRender) {
      hooksMap[VDOMPointer] = {};
    }
    const useState = makeUseState(VDOMPointer, isFirstRender);
    globalHooksReplacer.useState = useState;
    // START HERE
    // We will need to register useEffect so it works for our components
  };

export const createHooks = (onUpdate, registerOnUpdatedCallback) => {
  // hooksMap[[0,0,0]] is the hooks for the component with VDOMPointer [0, 0, 0]
  const hooksMap = {};
  // individual hooks have the following structure { state: [], effects: []}
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

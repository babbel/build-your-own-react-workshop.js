import { vdomPointerKeyToVDOMPointerArray } from './vdom-helpers';
// Hooks
let globalHooksReplacer = {};

export const useState = (...args) => globalHooksReplacer.useState(...args);
export const useEffect = (...args) => globalHooksReplacer.useEffect(...args);

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
    // it updates the combined callback reference
    // to call itself first (so it calls all the previously registered callbacks)
    // and then calls the newly registered one
    const { current } = combinedCallbackRef;
    combinedCallbackRef.current = () => {
      current();
      callback();
    };
  };
  return (VDOMPointer, isFirstRender) => {
    const effectIndexRef = { current: 0 };
    const hooksMapPointer = hooksMap[VDOMPointer];
    if (isFirstRender) {
      hooksMapPointer.effect = [];
    }
    return (effectCallback, dependencies) => {
      const effectIndex = effectIndexRef.current;
      const previousEffect = hooksMapPointer.effect[effectIndex] || {};

      const { cleanUp = () => {} } = previousEffect;
      effectIndexRef.current += 1;
      if (areDependenciesEqual(previousEffect.dependencies, dependencies)) {
        return;
      }

      cleanUp();
      hooksMapPointer.effect[effectIndex] = {
        dependencies: [...dependencies],
        cleanUp: () => {},
      };

      registerEffectForNextRender(() => {
        hooksMapPointer.effect[effectIndex].cleanUp =
          effectCallback() || (() => {});
      });
    };
  };
};

// Higher-Order Function that replaces hooks so they know which component
// they relate to (at the specified VDOMPointer)
const makeRegisterHooks =
  (hooksMap, makeUseState, makeUseEffect) => (VDOMPointer, isFirstRender) => {
    if (isFirstRender) {
      hooksMap[VDOMPointer] = {};
    }
    const useState = makeUseState(VDOMPointer, isFirstRender);
    globalHooksReplacer.useState = useState;

    const useEffect = makeUseEffect(VDOMPointer, isFirstRender);
    globalHooksReplacer.useEffect = useEffect;
  };

const makeCleanHooks = hooksMap => isElementStillMounted => {
  Object.keys(hooksMap)
    .map(vdomPointerKeyToVDOMPointerArray)
    .forEach(VDOMpointer => {
      // TODO double check if this is safe as there might still be something in the VDOM at this spot
      if (isElementStillMounted(VDOMpointer)) {
        return;
      }
      const hooks = hooksMap[VDOMpointer];
      hooks.effect.forEach(effect => effect.cleanUp());
      delete hooksMap[VDOMpointer];
    });
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
  const registerHooks = makeRegisterHooks(
    hooksMap,
    makeUseState,
    makeUseEffect,
  );

  hooks.current = { registerHooks, cleanHooks: makeCleanHooks(hooksMap) };

  return hooks.current;
};

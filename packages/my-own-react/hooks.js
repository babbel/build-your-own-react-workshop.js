import { vdomPointerKeyToVDOMPointerArray } from './vdom-helpers';
// Hooks
// should appear in chapter-2/step-2
let globalHooksReplacer = {};

// should appear in chapter-2/step-2
export const useState = (...args) => globalHooksReplacer.useState(...args);
// Should appear in chapter-4/step-2
export const useEffect = (...args) => globalHooksReplacer.useEffect(...args);

const isStatesDiffer = (prev, next) => {
  if (typeof next === 'object') {
    return JSON.stringify(prev) !== JSON.stringify(next);
  }

  return prev !== next;
};

// should appear in chapter-2/step-2
const makeMakeUseState =
  (onUpdate, hooksMap) => (VDOMPointer, isFirstRender) => {
    // stateIndexRef should appear in chapter-3/step-1
    let stateIndexRef = { current: 0 };
    let hooksMapPointer = hooksMap[VDOMPointer];
    if (isFirstRender) {
      hooksMapPointer.state = [];
    }
    return initialState => {
      // stateIndexRef should appear in chapter-3/step-1
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
          // stateIndex should appear in chapter-3/step-1
          const ownState = hooksMapPointer.state[stateIndex];
          const previousState = ownState[0];
          const currentState = newStateFn(previousState);
          const shouldUpdateState = isStatesDiffer(previousState, currentState);

          if (shouldUpdateState) {
            ownState[0] = currentState;
            onUpdate();
          }
        };
        // stateIndex should appear in chapter-3/step-1
        hooksMapPointer.state[stateIndex] = [computedInitialState, setState];
      }
      // stateIndex should appear in chapter-3/step-1
      return hooksMapPointer.state[stateIndex];
    };
  };

// Should appear in chapter-4/step-2
const areDependenciesEqual = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.every((element, index) => element === b[index]);

// Should appear in chapter-4/step-2
const makeMakeUseEffect = (registerOnUpdatedCallback, hooksMap) => {
  const combinedCallbackRef = { current: () => {} };
  registerOnUpdatedCallback(() => {
    combinedCallbackRef.current();
    combinedCallbackRef.current = () => {};
  });
  const registerEffectForNextRender = callback => {
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
      // START HERE
      // This function is the only one you should need to modify for clean-ups!
      const effectIndex = effectIndexRef.current;
      const previousEffect = hooksMapPointer.effect[effectIndex] || {};
      effectIndexRef.current += 1;
      if (areDependenciesEqual(previousEffect.dependencies, dependencies)) {
        return;
      }
      hooksMapPointer.effect[effectIndex] = {
        dependencies: [...dependencies],
      };
      registerEffectForNextRender(() => {
        // Here we will save the cleanUp to be called later in our effect structure
        // but where does the cleanUp come from?
        // hooksMapPointer.effect[effectIndex].cleanUp = ...

        effectCallback();
      });
    };
  };
};

// interface should appear in chapter-2/step-2
const makeRegisterHooks =
  (hooksMap, makeUseState, makeUseEffect) => (VDOMPointer, isFirstRender) => {
    if (isFirstRender) {
      hooksMap[VDOMPointer] = {};
    }
    const useState = makeUseState(VDOMPointer, isFirstRender);
    globalHooksReplacer.useState = useState;
    // Should appear in chapter-4/step-2
    const useEffect = makeUseEffect(VDOMPointer, isFirstRender);
    globalHooksReplacer.useEffect = useEffect;
  };

// Should appear in chapter-4/step-2
export const createHooks = (onUpdate, registerOnUpdatedCallback) => {
  // interface should appear in chapter-2/step-1
  // const createHooks = (onUpdate) => {
  // structure is given before but implementation should appear in chapter-2/step-2
  const hooksMap = {};
  const hooks = { current: null };
  const boundOnUpdate = () => onUpdate(hooks.current);
  const makeUseState = makeMakeUseState(boundOnUpdate, hooksMap);
  // Should appear in chapter-4/step-2
  const makeUseEffect = makeMakeUseEffect(registerOnUpdatedCallback, hooksMap);
  const registerHooks = makeRegisterHooks(
    hooksMap,
    makeUseState,
    makeUseEffect,
  );
  hooks.current = { registerHooks };
  return hooks.current;
};

import { vdomPointerKeyToVDOMPointerArray } from './vdom-helpers';
// Hooks
// should appear in chapter-2/step-2
let globalHooksReplacer = {};

// should appear in chapter-2/step-2
export const useState = (...args) => globalHooksReplacer.useState(...args);

const isStatesDiffer = (prev, next) => {
  if (typeof next === 'object') {
    return JSON.stringify(prev) !== JSON.stringify(next);
  }

  return prev !== next;
};

// should appear in chapter-2/step-2
const createMakeUseState =
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

// interface should appear in chapter-2/step-2
const makeRegisterHooks =
  (hooksMap, makeUseState) => (VDOMPointer, isFirstRender) => {
    if (isFirstRender) {
      hooksMap[VDOMPointer] = {};
    }
    const useState = makeUseState(VDOMPointer, isFirstRender);
    globalHooksReplacer.useState = useState;
  };

export const createHooks = (onUpdate) => {
  // interface should appear in chapter-2/step-1
  // const createHooks = (onUpdate) => {
  // structure is given before but implementation should appear in chapter-2/step-2
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

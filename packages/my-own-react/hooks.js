import { vdomPointerKeyToVDOMPointerArray } from './vdom-helpers';

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
    let hooksMapPointer = hooksMap[VDOMPointer];
    return initialState => {
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
      if (isFirstRender) {
        const computedInitialState =
          typeof initialState === 'function' ? initialState() : initialState;
        const setState = newStateOrCb => {
          const newStateFn =
            typeof newStateOrCb === 'function'
              ? newStateOrCb
              : () => newStateOrCb;
          const ownState = hooksMapPointer.state;
          const previousState = ownState[0];
          const currentState = newStateFn(previousState);
          const shouldUpdateState = isStatesDiffer(previousState, currentState);

          if (shouldUpdateState) {
            ownState[0] = currentState;
            onUpdate();
          }
        };
        hooksMapPointer.state = [computedInitialState, setState];
      }
      return hooksMapPointer.state;
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

export const createHooks = onUpdate => {
  // hooksMap[[0,0,0]] is the hooks for the component with VDOMPointer [0, 0, 0]
  const hooksMap = {};
  // individual hooks have the following structure { state: [], effects: []}
  const hooks = { current: null };
  const boundOnUpdate = () => onUpdate(hooks.current);
  const makeUseState = createMakeUseState(boundOnUpdate, hooksMap);
  const registerHooks = makeRegisterHooks(hooksMap, makeUseState);
  hooks.current = { registerHooks };
  return hooks.current;
};

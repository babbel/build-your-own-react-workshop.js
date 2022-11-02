import * as React from '../../node_modules/react';
import { tapFn } from './fn-utils';
export { DOMHandlers } from './dom-handlers';

export default React;

export const createElement = tapFn('createElement', React.createElement);
// export const useState = (initialState) => [initialState, () => {}];

/*

VDOM with pointer idea


Given the DOM:
<div>
  <span>
    <strong>yo</strong>
    Hello world!
  </span>
  <button>Test</button>
</div>

And a structure where we represent an element and its children as a tuple, for example
[strong, [['yo']]]

Gets you the following VDOM representation:
const VDOM = [
  [div,
    [span,
      [strong,
        ['yo']
      ], 
      ['Hello world!']
    ],
    [button,
      ['Test']
    ]
  ]
]

// So a pointer to it can look like:
const pointerToHelloWorld = [0, 1, 2];
const element = getVDOMElement(pointerToHelloWorld, VDOM); // [`Hello world!`]
And you access the element itself by extracting the first element in the tuple, e.g.
const [button] = getVDOMElement([0, 2]], VDOM); // button
*/


export const isNonPrimitiveElement = (element) => typeof element === 'object' && element.type;

const getVDOMElement = (pointer, VDOM) => pointer.reduce((targetElement, currentIndex) => (targetElement[currentIndex] || []), VDOM);

const setCurrentVDOMElement = (pointer, element, VDOM) => {
  const pointerToCurrent = getVDOMElement(pointer.slice(0, -1), VDOM.current);
  pointerToCurrent[pointer[pointer.length - 1]] = element;
};

const renderComponentElement = (element, VDOM, VDOMPointer, hooks) => {
  const { props: { children, ...props }, type } = element;
  const [previousDOMElement] = getVDOMElement(VDOMPointer, VDOM.previous);
  const isFirstRender = previousDOMElement === undefined || previousDOMElement.type !== element.type;
  if (typeof type === 'function') {
    hooks.registerHooks(VDOMPointer, isFirstRender);
    const renderedElement = type({ children, ...props });
    setCurrentVDOMElement(VDOMPointer, [element], VDOM);
    const renderedElementDOM = render(renderedElement, VDOM, [...VDOMPointer, 1], hooks);
    return renderedElementDOM;
  }
  if (children) {
    const childrenArray = Array.isArray(children) ? children : [children];
    setCurrentVDOMElement(VDOMPointer, [element], VDOM);
    const renderedChildren = childrenArray.map((child, index) => render(child, VDOM, [...VDOMPointer, index + 1], hooks));
    return { props: { children: renderedChildren, ...props }, type };
  }
  setCurrentVDOMElement(VDOMPointer, [element], VDOM);
  return { props, type };
}

const renderPrimitive = primitiveType => primitiveType;

const render = (element, VDOM, VDOMPointer, hooks) =>
  isNonPrimitiveElement(element) ?
    renderComponentElement(element, VDOM, VDOMPointer, hooks) :
    renderPrimitive(element);

const rootRender = (element, hooks, vdom) => {
  let dom = render(element, vdom, [0], hooks);
  vdom.previous = vdom.current;
  vdom.current = [];
  return dom;
};



// Hooks
let globalHooksReplacer = {};

export const useState = (...args) => globalHooksReplacer.useState(...args);

const makeMakeSetState = (onUpdate, hooksMap) => (VDOMPointer, stateIndex) => (newStateOrCb) => {
  const newStateFn = typeof newStateOrCb === 'function' ? newStateOrCb : () => newStateOrCb;
  hooksMap[VDOMPointer].state[stateIndex] = newStateFn(hooksMap[VDOMPointer].state[stateIndex]);
  onUpdate();
};

const makeMakeUseState = (makeSetState, hooksMap) => (VDOMPointer, isFirstRender) => {
  let stateIndexRef = { current: 0 };
  let hooksMapPointer = hooksMap[VDOMPointer];
  if (isFirstRender) {
    hooksMapPointer.state = [];
  }
  return (initialValue) => {
    const stateIndex = stateIndexRef.current;
    stateIndexRef.current += 1; 
    if (isFirstRender) {
      hooksMapPointer.state[stateIndex] = initialValue;
    }
    return [hooksMapPointer.state[stateIndex], makeSetState(VDOMPointer, stateIndex)];
  };
}

const makeRegisterHooks = (hooksMap, makeUseState) => (VDOMPointer, isFirstRender) => {
  if (isFirstRender) {
    hooksMap[VDOMPointer] = {};
  }
  const useState = makeUseState(VDOMPointer, isFirstRender);
  globalHooksReplacer.useState = useState;
}

const createHooks = (onUpdate) => {
  const hooksMap = {};
  const hooks = { current: null };
  const boundOnUpdate = () => onUpdate(hooks.current);
  const makeSetState = makeMakeSetState(boundOnUpdate, hooksMap);
  const makeUseState = makeMakeUseState(makeSetState, hooksMap);
  const registerHooks = makeRegisterHooks(hooksMap, makeUseState);
  hooks.current = { registerHooks };
  return hooks.current;
}

export const startRenderSubscription = (element, updateCallback) => {
  let vdom = {
    previous: [],
    current: [],
  };
  const update = (hooks) => {
    const dom = rootRender(element, hooks, vdom);
    updateCallback(dom);
  };
  const hooks = createHooks(update);
  update(hooks);
};

export const {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  unstable_act,
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  SuspenseList,
  cloneElement,
  createContext,
  // createElement,
  createFactory,
  createMutableSource,
  createRef,
  createServerContext,
  use,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  cache,
  startTransition,
  unstable_Cache,
  unstable_DebugTracingMode,
  unstable_LegacyHidden,
  unstable_Offscreen,
  unstable_Scope,
  unstable_TracingMarker,
  unstable_getCacheSignal,
  unstable_getCacheForType,
  unstable_useCacheRefresh,
  unstable_useMemoCache,
  useId,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  experimental_useEvent,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useMutableSource,
  useSyncExternalStore,
  useReducer,
  useRef,
  // useState,
  useTransition,
  version
} = React;

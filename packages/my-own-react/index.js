import * as React from '../../node_modules/react';
import { tapFn } from './fn-utils';
export { DOMHandlers } from './dom-handlers';

export default React;

export const createElement = tapFn('createElement', React.createElement);
// export const useState = (initialState) => [typeof initialState === 'function' ? initialState() : initialState, () => {}];

export const useEffect = () => {};

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

And a structure where we represent an element and its rendered children as a structure with an element and renderedChildren, for example
const VDOMforStrong = { element: { type: strong, props: {}}, renderedChildren: [{ element: 'yo' }]];

So we get the full picture of the DOM above as the following VDOM representation:
const VDOM = {
  element: { type: div, props: {}},
  renderedChildren: [
    {
      element: { type: span, props: {}},
      renderedChildren: [
        {
          element: { type: strong, props: {}},
          renderedChildren: [{ element: 'yo' }]
        },
        {
          element: 'Hello world!',
        }
      ]
    }, {
      element: { type: button, props: {}},
      renderedChildren: [{ element: 'Test' }],
    }
  ]
}

We can then create "pointer"s to access specific children based on their location in the tree, for example to access "Hello world!",
we need to dig into the first element's children picking the first child "span", then pick the second child from that element which is "Hello world!". 
// So a pointer to it can look like:
const pointerToHelloWorld = [0, 1];
const element = getVDOMElement(pointerToHelloWorld, VDOM); // [`Hello world!`]
And you access the element itself by extracting taking the element from it, e.g.
const { element: button } = getVDOMElement([1]], VDOM); // button
*/


export const isNonPrimitiveElement = (element) => typeof element === 'object' && element.type;

const getVDOMElement = (pointer, VDOM) => pointer.reduce(
  (targetElement, currentIndex) => targetElement ? (targetElement.renderedChildren || [])[currentIndex] : targetElement,
  VDOM
);

const setCurrentVDOMElement = (pointer, element, VDOM) => {
  if (pointer.length === 0) {
    VDOM.current = element;
    return;
  }
  const pointerToParent = getVDOMElement(pointer.slice(0, -1), VDOM.current);
  const currentChildIndex = pointer[pointer.length - 1];
  pointerToParent.renderedChildren[currentChildIndex] = element;
};

const createVDOMElement = (element, renderedChildren = []) => ({
  element,
  renderedChildren,
});

const renderComponentElement = (element, VDOM, VDOMPointer, hooks) => {
  const { props: { children, ...props }, type } = element;
  const previousDOMElement = (getVDOMElement(VDOMPointer, VDOM.previous) || {}).element;
  const isFirstRender = previousDOMElement === undefined || previousDOMElement.type !== element.type;
  if (typeof type === 'function') {
    hooks.registerHooks(VDOMPointer, isFirstRender);
    const renderedElement = type({ children, ...props });
    setCurrentVDOMElement(VDOMPointer, createVDOMElement(element), VDOM);
    const renderedElementDOM = render(renderedElement, VDOM, [...VDOMPointer, 0], hooks);
    return renderedElementDOM;
  }
  if (children) {
    const childrenArray = Array.isArray(children) ? children : [children];
    setCurrentVDOMElement(VDOMPointer, createVDOMElement(element), VDOM);
    const renderedChildren = childrenArray.map((child, index) => render(child, VDOM, [...VDOMPointer, index], hooks));
    return { props: { children: renderedChildren, ...props }, type };
  }
  setCurrentVDOMElement(VDOMPointer, createVDOMElement(element), VDOM);
  return { props, type };
}

const renderPrimitive = primitiveType => primitiveType;

const render = (element, VDOM, VDOMPointer, hooks) =>
  isNonPrimitiveElement(element) ?
    renderComponentElement(element, VDOM, VDOMPointer, hooks) :
    renderPrimitive(element);

const rootRender = (element, hooks, vdom) => {
  let dom = render(element, vdom, [], hooks);
  vdom.previous = vdom.current;
  vdom.current = [];
  return dom;
};



// Hooks
let globalHooksReplacer = {};

export const useState = (...args) => globalHooksReplacer.useState(...args);

const makeMakeUseState = (onUpdate, hooksMap) => (VDOMPointer, isFirstRender) => {
  let stateIndexRef = { current: 0 };
  let hooksMapPointer = hooksMap[VDOMPointer];
  if (isFirstRender) {
    hooksMapPointer.state = [];
  }
  return (initialState) => {
    const stateIndex = stateIndexRef.current;
    stateIndexRef.current += 1; 
    if (isFirstRender) {
      hooksMapPointer.state[stateIndex] = typeof initialState === 'function' ? initialState() : initialState;
    }
    const setState = (newStateOrCb) => {
      const newStateFn = typeof newStateOrCb === 'function' ? newStateOrCb : () => newStateOrCb;
      hooksMap[VDOMPointer].state[stateIndex] = newStateFn(hooksMap[VDOMPointer].state[stateIndex]);
      onUpdate();
    };
    return [hooksMapPointer.state[stateIndex], setState];
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
  const makeUseState = makeMakeUseState(boundOnUpdate, hooksMap);
  const registerHooks = makeRegisterHooks(hooksMap, makeUseState);
  hooks.current = { registerHooks };
  return hooks.current;
}

export const startRenderSubscription = (element, updateCallback) => {
  let vdom = {
    previous: {},
    current: {},
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
  // useEffect,
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

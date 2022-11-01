import * as React from '../../node_modules/react';
import { tapFn } from './fn-utils';
export { DOMHandlers } from './dom-handlers';

export default React;

export const createElement = tapFn('createElement', React.createElement);
// export const useState = (initialState) => [initialState, () => {}];

let globalDomTimeline = {
  previous: [],
  current: [],
};

/*

<div>
  <span>
    <strong>yo</strong>
    Hello world!
  </span>
  <button>Test</button>
</div>

*/

/*
const dom = [
  [div, [
    [span, [[strong, ['yo']], 'Hello world!']],
    [button, ['Test']]
  ]]
]

const pointerToHelloWorld = [0, 0, 1]
*/


export const isNonPrimitiveElement = (element) => typeof element === 'object' && element.type;

const getDomTimelineElement = (pointer, domTimeline) => pointer.reduce((targetElement, currentIndex) => (targetElement || [])[currentIndex], domTimeline.previous);

const setCurrentDomTimelineElement = (pointer, element, domTimeline) => {
  let pointerToCurrent = domTimeline.current;
  pointer.slice(0, -1).forEach((currentIndex) => {
    pointerToCurrent = pointerToCurrent[currentIndex];
  });
  pointerToCurrent[pointer[pointer.length - 1]] = element;
};

const renderComponentElement = (element, domTimeline, domTimelinePointer, hooks) => {
  const { props: { children, ...props }, type } = element;
  const previousDOMElement = getDomTimelineElement(domTimelinePointer, domTimeline);
  const isFirstRender = previousDOMElement === undefined || previousDOMElement.type === element.type;
  if (typeof type === 'function') {
    hooks.registerHooks(domTimelinePointer, isFirstRender);
    const renderedElement = type({ children, ...props });
    setCurrentDomTimelineElement(domTimelinePointer, [element, []], domTimeline);
    const renderedElementDOM = render(renderedElement, domTimeline, [...domTimelinePointer, 0], hooks);
    return renderedElementDOM;
  }
  if (children) {
    const childrenArray = Array.isArray(children) ? children : [children];
    setCurrentDomTimelineElement(domTimelinePointer, [element, []], domTimeline);
    const renderedChildren = childrenArray.map((child, index) => {
      const renderedChild = render(child, domTimeline, [...domTimelinePointer, index], hooks);
      return renderedChild;
    });
    return { props: { children: renderedChildren, ...props }, type };
  }
  setCurrentDomTimelineElement(domTimelinePointer, [element], domTimeline);
  return { props, type };
}

const renderPrimitive = primitiveType => primitiveType;

const render = (element, domTimeline, domTimelinePointer, hooks) =>
  isNonPrimitiveElement(element) ?
    renderComponentElement(element, domTimeline, domTimelinePointer, hooks) :
    renderPrimitive(element);

const rootRender = (element, hooks) => {
  let dom = render(element, globalDomTimeline, [0], hooks);
  globalDomTimeline.previous = globalDomTimeline.current;
  globalDomTimeline.current = {};
  return dom;
};

let globalHooksReplacer = {};

export const useState = (...args) => globalHooksReplacer.useState(...args);

export const startRenderSubscription = (element, updateCallback) => {
  const update = (hooks) => {
    const dom = rootRender(element, hooks);
    updateCallback(dom);
  };
  const hooksMap = {};
  const hooks = {
    hooksMap,
    makeSetState: (domTimelinePointer, stateIndex) => newStateOrCb => {
      const newStateFn = typeof newStateOrCb === 'function' ? newStateOrCb : () => newStateOrCb;
      hooksMap[domTimelinePointer].state[stateIndex] = newStateFn(hooksMap[domTimelinePointer].state[stateIndex]);
      update(hooks);
    },
    makeUseState: (domTimelinePointer, isFirstRender) => {
      let stateIndex = 0;
      let hooksMapPointer = hooksMap[domTimelinePointer];
      if (isFirstRender) {
        hooksMapPointer.state = [];
      }
      return (initialValue) => {
        if (isFirstRender) {
          hooksMapPointer.state[stateIndex] = initialValue;
        }
        return [hooksMapPointer.state[stateIndex], hooks.makeSetState(domTimelinePointer, stateIndex)];
      };
    },
    registerHooks: (domTimelinePointer, isFirstRender) => {
      if (isFirstRender) {
        hooksMap[domTimelinePointer] = {};
      }
      const useState = hooks.makeUseState(domTimelinePointer, isFirstRender);
      globalHooksReplacer.useState = useState;
    }
  };
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

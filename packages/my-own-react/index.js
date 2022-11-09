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
const strongVDOM = [strong, ['yo']];

Then we can have more children, for example:
const spanVDOM = [span, strongVDOM], ['Hello World!']];
And if we make it altogether
const spanVDOM = [span, [strong, ['yo']]], ['Hello World!']];

So we get the full picture of the DOM above as the following VDOM representation:
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

const renderPrimitive = (primitiveType, VDOM, VDOMPointer) => {
  setCurrentVDOMElement(VDOMPointer, [primitiveType], VDOM);
  return primitiveType;
};

const render = (element, VDOM, VDOMPointer, hooks) =>
  isNonPrimitiveElement(element) ?
    renderComponentElement(element, VDOM, VDOMPointer, hooks) :
    renderPrimitive(element, VDOM, VDOMPointer);

const rootRender = (element, hooks, vdom) => {
  let dom = render(element, vdom, [0], hooks);
  return dom;
};



// Hooks
let globalHooksReplacer = {};

export const useState = (...args) => globalHooksReplacer.useState(...args);

const isStatesDiffer = (prev, next) => {
  if (typeof next === 'object') {
    return JSON.stringify(prev) !== JSON.stringify(next);
  }

  return prev !== next;
}

const makeMakeUseState = (onUpdate, hooksMap) => (VDOMPointer, isFirstRender) => {
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
    const setState = (newStateOrCb) => {
      const newStateFn = typeof newStateOrCb === 'function' ? newStateOrCb : () => newStateOrCb;
      const prevState = hooksMap[VDOMPointer].state[stateIndex];
      const currState = newStateFn(hooksMap[VDOMPointer].state[stateIndex]);
      const shouldUpdateState = isStatesDiffer(prevState, currState);

      if (shouldUpdateState) {
        hooksMap[VDOMPointer].state[stateIndex] = currState;
        onUpdate();
      }
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

const compareVDOMElement = (prev, curr, pointer = [0]) => {
  const pointerStr = pointer.join(',');

  // no change
  if (!prev && !curr) {
    return {};
  }

  // added element
  if (!prev) {
    return { [pointerStr]: ['node_added'] };
  }

  // removed element
  if (!curr) {
    return { [pointerStr]: ['node_removed'] };
  }

  const prevElement = prev[0];
  const currElement = curr[0];

  // Have different types
  if (
    typeof prevElement !== typeof currElement
    || typeof prevElement.type !== typeof currElement.type
  ) {
    return { [pointerStr]: ['node_replaced'] };
  }

  // Both same type 👇

  // If both primitive
  if (
    !isNonPrimitiveElement(prevElement) && !isNonPrimitiveElement(currElement)
  ) {
    if (prevElement !== currElement) {
      return { [pointerStr]: ['node_innerTextUpdate', currElement] };
    }

    // no change
    return {};
  }

  const changedProps = {};
  // not function
  if (typeof prevElement.type !== 'function') {
    // Compare props
    const keys = Array.from(new Set([
      ...Object.keys(prevElement.props),
      ...Object.keys(currElement.props),
    ]));
    for (var index = 0; index < keys.length; index++) {
      const key = keys[index];
      if (key === 'children') {
        continue;
      }

      // seperating this case just in case we may wanna delete the prop directly
      if (!(key in currElement.props)) {
        changedProps[key] = ['removed'];
        continue;
      }

      if (currElement.props[key] !== prevElement.props[key]) {
        changedProps[key] = ['updated', currElement.props[key]];
      }
    }
  }

  let diff = {};
  // conditional case to keep output clean
  if (Object.keys(changedProps).length > 0) {
    diff[pointerStr] = ['props', changedProps];
  }

  // Recursive into children
  const prevChildren = prev.slice(1);
  const currChildren = curr.slice(1);
  const maxIndex = Math.max(prevChildren.length, currChildren.length);
  for (let index = 0; index < maxIndex; index++) {
    const res = compareVDOMElement(prevChildren[index], currChildren[index], [...pointer, index + 1]);
    if (res) {
      diff = { ...diff, ...res };
    }
  }

  return diff;
};

const getVDOMDiff = (VDOM) => {
  return compareVDOMElement(VDOM.previous[0], VDOM.current[0]);
};

const getDOMPointerFromVDOMPointer = (VDOM, VDOMPointer) => {
  const DOMPointer = [0];

  VDOMPointer.split(',').slice(1).reduce((tree, index) => {
    const notRenderedElementCount = tree.slice(0, index).filter(el => el[0] === false).length;
    const remaininIndex = index - notRenderedElementCount;
    const normalizedIndex = remaininIndex - 1;

    if (typeof tree[0].type !== 'function') {
      DOMPointer.push(normalizedIndex);
    }

    return tree[index];
  }, VDOM.current[0]);

  return DOMPointer;
}

export const startRenderSubscription = (element, updateCallback) => {
  let vdom = {
    previous: [],
    current: [],
  };
  const update = (hooks) => {
    const dom = rootRender(element, hooks, vdom);
    // console.log('vdom.current: ', vdom.current);
    const _diff = getVDOMDiff(vdom);
    // console.log('_diff: ', _diff);

    const diff = Object.keys(_diff).reduce((d, key) => {
      d[getDOMPointerFromVDOMPointer(vdom, key)] = _diff[key];
      return d;
    }, {});
    // console.log('diff: ', diff);

    vdom.previous = vdom.current;
    vdom.current = [];

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

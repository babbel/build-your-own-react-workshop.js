import * as React from '../../node_modules/react';
import { tapFn } from './fn-utils';
export { DOMHandlers } from './dom-handlers';

export default React;

export const createElement = tapFn('createElement', React.createElement);
// export const useState = (initialState) => [typeof initialState === 'function' ? initialState() : initialState, () => {}];
// export const useEffect = () => {};

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

const vdomPointerKeyToVDOMPointerArray = (pointerAsString) => {
  // The empty array ends up with an empty string, so this needs extra care when transforming
  if (pointerAsString === '') {
    return [];
  }
  // All the others end up split by `,` so we can split them back and transform the string to a number
  return pointerAsString.split(',').map(s => parseInt(s));
};

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

const renderPrimitive = (primitiveType, VDOM, VDOMPointer) => {
  setCurrentVDOMElement(VDOMPointer, createVDOMElement(primitiveType), VDOM);
  return primitiveType;
};

const render = (element, VDOM, VDOMPointer, hooks) =>
  isNonPrimitiveElement(element) ?
    renderComponentElement(element, VDOM, VDOMPointer, hooks) :
    renderPrimitive(element, VDOM, VDOMPointer);

const rootRender = (element, hooks, vdom) => {
  let dom = render(element, vdom, [], hooks);
  hooks.cleanHooks((VDOMPointer) => getVDOMElement(VDOMPointer, vdom.current) !== undefined);
  return dom;
};



// Hooks
let globalHooksReplacer = {};

export const useState = (...args) => globalHooksReplacer.useState(...args);
export const useEffect = (...args) => globalHooksReplacer.useEffect(...args);

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
  return (initialState) => {
    const stateIndex = stateIndexRef.current;
    stateIndexRef.current += 1;
    if (isFirstRender) {
      const computedInitialState = typeof initialState === 'function' ? initialState() : initialState;
      const setState = (newStateOrCb) => {
        const newStateFn = typeof newStateOrCb === 'function' ? newStateOrCb : () => newStateOrCb;
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
}

const areDependenciesEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.every((element, index) => element === b[index]);

const makeMakeUseEffect = (registerOnUpdatedCallback, hooksMap) => {
  const combinedCallbackRef = { current: () => {} };
  registerOnUpdatedCallback(() => {
    combinedCallbackRef.current();
    combinedCallbackRef.current = () => {};
  });
  const registerEffectForNextRender = (callback) => {
    const { current } = combinedCallbackRef;
    combinedCallbackRef.current = () => {
      current();
      callback();
    };
  };
  return  (VDOMPointer, isFirstRender) => {
    const effectIndexRef = { current: 0 };
    const hooksMapPointer = hooksMap[VDOMPointer];
    if (isFirstRender) {
      hooksMapPointer.effect = [];
    }
    return (effectCallback, dependencies) => {
      const effectIndex = effectIndexRef.current;
      const previousEffect = hooksMapPointer.effect[effectIndex] || {};
      const { cleanUp = (() => {})} = previousEffect;
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
        hooksMapPointer.effect[effectIndex].cleanUp = (effectCallback() || (() => {}));
      });
    };
  }
}

const makeRegisterHooks = (hooksMap, makeUseState, makeUseEffect) => (VDOMPointer, isFirstRender) => {
  if (isFirstRender) {
    hooksMap[VDOMPointer] = {};
  }
  const useState = makeUseState(VDOMPointer, isFirstRender);
  globalHooksReplacer.useState = useState;
  const useEffect = makeUseEffect(VDOMPointer, isFirstRender);
  globalHooksReplacer.useEffect = useEffect;
}

const makeCleanHooks = (hooksMap) => (isElementStillMounted) => {
  Object.keys(hooksMap).map(
    vdomPointerKeyToVDOMPointerArray
  ).forEach(VDOMpointer => {
    if (isElementStillMounted(VDOMpointer)) {
      return;
    }
    const hooks = hooksMap[VDOMpointer];
    hooks.effect.forEach((effect) => effect.cleanUp());
    delete hooksMap[VDOMpointer];
  });
};

const createHooks = (onUpdate, registerOnUpdatedCallback) => {
  const hooksMap = {};
  const hooks = { current: null };
  const boundOnUpdate = () => onUpdate(hooks.current);
  const makeUseState = makeMakeUseState(boundOnUpdate, hooksMap);
  const makeUseEffect = makeMakeUseEffect(registerOnUpdatedCallback, hooksMap);
  const registerHooks = makeRegisterHooks(hooksMap, makeUseState, makeUseEffect);
  hooks.current = { registerHooks, cleanHooks: makeCleanHooks(hooksMap) };
  return hooks.current;
}

const compareVDOMElement = (prev, curr, pointer = []) => {
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

  const prevElement = prev.element;
  const currElement = curr.element;

  // Have different types
  if (
    typeof prevElement !== typeof currElement
    || typeof (prevElement || {}).type !== typeof (currElement || {}).type
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
  const prevChildren = prev.renderedChildren;
  const currChildren = curr.renderedChildren;
  const maxIndex = Math.max(prevChildren.length, currChildren.length);
  for (let index = 0; index < maxIndex; index++) {
    const res = compareVDOMElement(prevChildren[index], currChildren[index], [...pointer, index]);
    if (res) {
      diff = { ...diff, ...res };
    }
  }

  return diff;
};

const getVDOMDiff = (VDOM) => {
  return compareVDOMElement(VDOM.previous, VDOM.current);
};

const getDOMPointerFromVDOMPointer = (VDOM, VDOMPointer) => {
  const DOMPointer = [0];

  vdomPointerKeyToVDOMPointerArray(VDOMPointer).reduce((VDOM, index) => {
    // TODO: this is currently broken, because this only checks for non-rendered elements in the current DOM
    // whereas we need to also check for them in the previous DOM
    const notRenderedElementCount = VDOM.renderedChildren.slice(0, index).filter(el => el[0] === false).length;
    const normalizedIndex = index - notRenderedElementCount;

    if (typeof VDOM.element.type !== 'function') {
      DOMPointer.push(normalizedIndex);
    }

    return VDOM.renderedChildren[index];
  }, VDOM.current);

  return DOMPointer;
}

export const startRenderSubscription = (element, updateCallback) => {
  let vdom = {
    previous: {},
    current: {},
  };
  let afterUpdate;
  const registerOnUpdatedCallback = (callback) => {
    afterUpdate = callback;
  };
  const update = (hooks) => {
    const dom = rootRender(element, hooks, vdom);
    // console.log('vdom.current: ', vdom.current);
    const _diff = getVDOMDiff(vdom);
    // console.log('_diff: ', _diff);

    const diff = Object.keys(_diff).reduce((d, key) => {
      d[key] = { domPointer: getDOMPointerFromVDOMPointer(vdom, key), diff: _diff[key] };
      return d;
    }, {});
    // console.log('diff: ', diff);

    vdom.previous = vdom.current;
    vdom.current = [];

    updateCallback(dom, diff);
    afterUpdate();
  };
  const hooks = createHooks(update, registerOnUpdatedCallback);
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

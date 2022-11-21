import * as React from '../../node_modules/react';
import { tapFn } from './fn-utils';
export { DOMHandlers } from './dom-handlers';

export default React;

export const createElement = tapFn('createElement', React.createElement);
// export const useState = (initialState) => [typeof initialState === 'function' ? initialState() : initialState, () => {}];
// export const useEffect = () => {};


// should appear in chapter-2/step-1
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

// should appear in chapter-2/step-1
export const isNonPrimitiveElementFromJSX = (element) => typeof element === 'object' && element.type;
export const isNonPrimitiveElementFromVDOM = (element) => element.type !== 'primitive';
export const isNonPrimitiveElement = (element) => isNonPrimitiveElementFromJSX(element) || isNonPrimitiveElementFromVDOM(element);

// should appear in chapter-2/step-1
const getVDOMElement = (pointer, VDOM) => pointer.reduce(
  (targetElement, currentIndex) => targetElement ? (targetElement.renderedChildren || [])[currentIndex] : targetElement,
  VDOM
);
// should appear in chapter-2/step-1
const setCurrentVDOMElement = (pointer, element, VDOM) => {
  if (pointer.length === 0) {
    VDOM.current = element;
    return;
  }
  const pointerToParent = getVDOMElement(pointer.slice(0, -1), VDOM.current);
  const currentChildIndex = pointer[pointer.length - 1];
  pointerToParent.renderedChildren[currentChildIndex] = element;
};

// should appear in chapter-2/step-1
const createVDOMElement = (element, renderedChildren = []) => ({
  element,
  renderedChildren,
});


// diff should appear in chapter-3/step-2
const vdomPointerKeyToVDOMPointerArray = (pointerAsString) => {
  // The empty array ends up with an empty string, so this needs extra care when transforming
  if (pointerAsString === '') {
    return [];
  }
  // All the others end up split by `,` so we can split them back and transform the string to a number
  return pointerAsString.split(',').map(s => parseInt(s));
};

// should appear in chapter-2/step-1
const renderComponentElement = (element, VDOM, VDOMPointer, hooks) => {
  const { props: { children, ...props }, type } = element;
  const previousDOMElement = (getVDOMElement(VDOMPointer, VDOM.previous) || {}).element;
  const isFirstRender = previousDOMElement === undefined || previousDOMElement.type !== element.type;
  const elementAsVDOMElement = { props, type, VDOMPointer };
  if (typeof type === 'function') {
    // should appear in chapter-2/step-2
    hooks.registerHooks(VDOMPointer, isFirstRender);
    const renderedElement = type({ children, ...props });
    setCurrentVDOMElement(VDOMPointer, createVDOMElement(elementAsVDOMElement), VDOM);
    const renderedElementDOM = render(renderedElement, VDOM, [...VDOMPointer, 0], hooks);
    return renderedElementDOM;
  }
  if (typeof children !== 'undefined') {
    const childrenArray = Array.isArray(children) ? children : [children];
    setCurrentVDOMElement(VDOMPointer, createVDOMElement(elementAsVDOMElement), VDOM);
    const renderedChildren = childrenArray.map((child, index) => render(child, VDOM, [...VDOMPointer, index], hooks));
    return { ...elementAsVDOMElement, props: { children: renderedChildren, ...elementAsVDOMElement.props } };
  }
  setCurrentVDOMElement(VDOMPointer, createVDOMElement(elementAsVDOMElement), VDOM);
  return elementAsVDOMElement;
}

// should appear in chapter-2/step-1
const renderPrimitive = (primitiveType, VDOM, VDOMPointer) => {
  const elementAsVDOMElement = { value: primitiveType, type: 'primitive', VDOMPointer };
  setCurrentVDOMElement(VDOMPointer, createVDOMElement(elementAsVDOMElement), VDOM);
  return elementAsVDOMElement;
};

// should appear in chapter-2/step-1
const render = (element, VDOM, VDOMPointer, hooks) =>
  isNonPrimitiveElementFromJSX(element) ?
    renderComponentElement(element, VDOM, VDOMPointer, hooks) :
    renderPrimitive(element, VDOM, VDOMPointer);

// should appear in chapter-2/step-1
const rootRender = (element, hooks, vdom) => {
  let renderableVDOM = render(element, vdom, [], hooks);
  // Should appear in final
  hooks.cleanHooks((VDOMPointer) => getVDOMElement(VDOMPointer, vdom.current) !== undefined);
  return renderableVDOM;
};



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
}

// should appear in chapter-2/step-2
const makeMakeUseState = (onUpdate, hooksMap) => (VDOMPointer, isFirstRender) => {
  // stateIndexRef should appear in chapter-3/step-1
  let stateIndexRef = { current: 0 };
  let hooksMapPointer = hooksMap[VDOMPointer];
  if (isFirstRender) {
    hooksMapPointer.state = [];
  }
  return (initialState) => {
    // stateIndexRef should appear in chapter-3/step-1
    const stateIndex = stateIndexRef.current;
    stateIndexRef.current += 1;
    if (isFirstRender) {
      const computedInitialState = typeof initialState === 'function' ? initialState() : initialState;
      const setState = (newStateOrCb) => {
        const newStateFn = typeof newStateOrCb === 'function' ? newStateOrCb : () => newStateOrCb;
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
}

// Should appear in chapter-4/step-2
const areDependenciesEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.every((element, index) => element === b[index]);

// Should appear in chapter-4/step-2
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
      // Should appear in final
      const { cleanUp = (() => {})} = previousEffect;
      effectIndexRef.current += 1;
      if (areDependenciesEqual(previousEffect.dependencies, dependencies)) {
        return;
      }
      // Should appear in final
      cleanUp();
      hooksMapPointer.effect[effectIndex] = {
        dependencies: [...dependencies],
        // Should appear in final
        cleanUp: () => {},
      };
      registerEffectForNextRender(() => {
        // Should appear in final
        hooksMapPointer.effect[effectIndex].cleanUp = (effectCallback() || (() => {}));
        // Should appear in chapter-4/step-2
        // effectCallback()
      });
    };
  }
}

// interface should appear in chapter-2/step-2
const makeRegisterHooks = (hooksMap, makeUseState, makeUseEffect) => (VDOMPointer, isFirstRender) => {
  if (isFirstRender) {
    hooksMap[VDOMPointer] = {};
  }
  const useState = makeUseState(VDOMPointer, isFirstRender);
  globalHooksReplacer.useState = useState;
  // Should appear in chapter-4/step-2
  const useEffect = makeUseEffect(VDOMPointer, isFirstRender);
  globalHooksReplacer.useEffect = useEffect;
}

// Should appear in final
const makeCleanHooks = (hooksMap) => (isElementStillMounted) => {
  Object.keys(hooksMap).map(
    vdomPointerKeyToVDOMPointerArray
  ).forEach(VDOMpointer => {
    // TODO double check if this is safe as there might still be something in the VDOM at this spot
    if (isElementStillMounted(VDOMpointer)) {
      return;
    }
    const hooks = hooksMap[VDOMpointer];
    hooks.effect.forEach((effect) => effect.cleanUp());
    delete hooksMap[VDOMpointer];
  });
};

// Should appear in chapter-4/step-2
const createHooks = (onUpdate, registerOnUpdatedCallback) => {
// interface should appear in chapter-2/step-1
// const createHooks = (onUpdate) => {
  // structure is given before but implementation should appear in chapter-2/step-2
  const hooksMap = {};
  const hooks = { current: null };
  const boundOnUpdate = () => onUpdate(hooks.current);
  const makeUseState = makeMakeUseState(boundOnUpdate, hooksMap);
  // Should appear in chapter-4/step-2
  const makeUseEffect = makeMakeUseEffect(registerOnUpdatedCallback, hooksMap);
  const registerHooks = makeRegisterHooks(hooksMap, makeUseState, makeUseEffect);
  // Should appear in final
  hooks.current = { registerHooks, cleanHooks: makeCleanHooks(hooksMap) };
  // hooks.current = { registerHooks };
  return hooks.current;
}

// Should appear in chapter-3/step-2
const compareVDOMElement = (currentRenderableVDOMElement, vdom, parentPointer) => {
  const prev = getVDOMElement(currentRenderableVDOMElement.VDOMPointer, vdom.previous);

  // no change
  if (!prev && !currentRenderableVDOMElement) {
    return [];
  }

  // added element
  if (!prev) {
    return [{ VDOMPointer: currentRenderableVDOMElement.VDOMPointer, type: 'node_added', payload: { node: currentRenderableVDOMElement, parentPointer } }];
  }

  // Hopefully this becomes redundant
  // removed element
  if (!currentRenderableVDOMElement) {
    return [{ VDOMPointer: currentRenderableVDOMElement.VDOMPointer, type: 'node_removed', payload: {} }];
  }

  const prevElement = prev.element;
  const currElement = currentRenderableVDOMElement;

  // Have different types
  if (
    typeof prevElement !== typeof currElement
    || typeof (prevElement || {}).type !== typeof (currElement || {}).type
  ) {
    return [{ VDOMPointer: currentRenderableVDOMElement.VDOMPointer, type: 'node_replaced', payload: { newNode: currentRenderableVDOMElement, oldNode: prevElement, parentPointer } }];
  }

  // Both same type 👇

  // If both primitive
  if (
    !isNonPrimitiveElementFromVDOM(prevElement) && !isNonPrimitiveElementFromVDOM(currElement)
  ) {
    if (prevElement.value !== currElement.value) {
      return [{ VDOMPointer: currentRenderableVDOMElement.VDOMPointer, type: 'node_innerTextUpdate', payload: { newElement: currElement } }];
    }

    // no change
    return [];
  }

  const changedProps = {};
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
      changedProps[key] = ['removed', { oldValue: prevElement.props[key] }];
      continue;
    }

    if (currElement.props[key] !== prevElement.props[key]) {
      changedProps[key] = ['updated', { newValue: currElement.props[key], oldValue: prevElement.props[key] }];
    }
  }

  let diff = [];
  // conditional case to keep output clean
  if (Object.keys(changedProps).length > 0) {
    diff.push(
      { VDOMPointer: currentRenderableVDOMElement.VDOMPointer, type: 'props', payload: changedProps }
    );
  }

  // Recursive into children
  const prevChildren = prev.renderedChildren || [];
  const currChildren = currentRenderableVDOMElement.props.children || [];
  const maxIndex = Math.max(prevChildren.length, currChildren.length);
  for (let index = 0; index < maxIndex; index++) {
    const currChild = currChildren[index];
    if (!currChild) {
      diff.push({ VDOMPointer: [...currentRenderableVDOMElement.VDOMPointer, index], type: 'node_removed', payload: {} })
      continue;
    }
    const res = compareVDOMElement(currChild, vdom, currentRenderableVDOMElement.VDOMPointer);
    if (res) {
      diff = [ ...diff, ...res ];
    }
  }

  return diff;
};

// Should appear in chapter-3/step-2
const getVDOMDiff = (renderableVDOM, vdom) => {
  return compareVDOMElement(renderableVDOM, vdom);
};

// interface should appear in chapter-2/step-1
export const startRenderSubscription = (element, updateCallback) => {
  let vdom = {
    previous: {},
    current: {},
  };
  // Should appear in chapter-4/step-2
  let afterUpdate;
  // Should appear in chapter-4/step-2
  const registerOnUpdatedCallback = (callback) => {
    afterUpdate = callback;
  };
  const update = (hooks) => {
    const renderableVDOM = rootRender(element, hooks, vdom);
    // diff should appear in chapter-3/step-2
    const diff = getVDOMDiff(renderableVDOM, vdom);


    vdom.previous = vdom.current;
    vdom.current = [];

    // diff should appear in chapter-4/step-1
    updateCallback(renderableVDOM, diff);
    // Should appear in chapter-4/step-2
    afterUpdate();
  };
  // Should appear in chapter-4/step-2
  const hooks = createHooks(update, registerOnUpdatedCallback);
  // const hooks = createHooks(update);
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

import * as React from '../../node_modules/react';
export { DOMHandlers } from './dom-handlers';
export default React;

import {
  getVDOMElement,
  setCurrentVDOMElement,
  createVDOMElement,
  createRenderableVDOMElement,
  createPrimitiveVDOMElement,
} from './vdom-helpers';
import { createHooks, useEffect, useState } from './hooks';
export { useEffect, useState };
import { getRenderableVDOMDiff } from './diff';

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
export const isPrimitiveElementFromJSX = element => typeof element !== 'object';

// should appear in chapter-2/step-1
const renderComponentElement = (element, VDOM, VDOMPointer, hooks) => {
  const {
    props: { children, ...props },
    type,
  } = element;
  const previousDOMElement = (getVDOMElement(VDOMPointer, VDOM.previous) || {})
    .element;
  const isFirstRender =
    previousDOMElement === undefined ||
    previousDOMElement.type !== element.type;
  const elementAsRenderableVDOMElement = createRenderableVDOMElement(
    props,
    type,
    VDOMPointer,
  );
  if (typeof type === 'function') {
    const FunctionalComponent = type;
    // should appear in chapter-2/step-2
    hooks.registerHooks(VDOMPointer, isFirstRender);
    const renderedElement = FunctionalComponent({ children, ...props });
    setCurrentVDOMElement(
      VDOMPointer,
      createVDOMElement(elementAsRenderableVDOMElement),
      VDOM,
    );
    const renderedElementDOM = render(
      renderedElement,
      VDOM,
      [...VDOMPointer, 0],
      hooks,
    );
    return renderedElementDOM;
  }
  if (typeof children !== 'undefined') {
    const childrenArray = Array.isArray(children) ? children : [children];
    setCurrentVDOMElement(
      VDOMPointer,
      createVDOMElement(elementAsRenderableVDOMElement),
      VDOM,
    );
    const renderedChildren = childrenArray.map((child, index) =>
      render(child, VDOM, [...VDOMPointer, index], hooks),
    );
    return {
      ...elementAsRenderableVDOMElement,
      props: {
        children: renderedChildren,
        ...elementAsRenderableVDOMElement.props,
      },
    };
  }
  setCurrentVDOMElement(
    VDOMPointer,
    createVDOMElement(elementAsRenderableVDOMElement),
    VDOM,
  );
  return elementAsRenderableVDOMElement;
};

// should appear in chapter-2/step-1
const renderPrimitive = (value, VDOM, VDOMPointer) => {
  const elementAsRenderableVDOMElement = createPrimitiveVDOMElement(
    value,
    VDOMPointer,
  );
  setCurrentVDOMElement(
    VDOMPointer,
    createVDOMElement(elementAsRenderableVDOMElement),
    VDOM,
  );
  return elementAsRenderableVDOMElement;
};

// should appear in chapter-2/step-1
const render = (element, VDOM, VDOMPointer, hooks) =>
  isPrimitiveElementFromJSX(element)
    ? renderPrimitive(element, VDOM, VDOMPointer)
    : renderComponentElement(element, VDOM, VDOMPointer, hooks);

// should appear in chapter-2/step-1
const rootRender = (element, hooks, vdom) => {
  let renderableVDOM = render(element, vdom, [], hooks);
  return renderableVDOM;
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
  const registerOnUpdatedCallback = callback => {
    afterUpdate = callback;
  };
  const update = hooks => {
    const renderableVDOM = rootRender(element, hooks, vdom);
    // diff should appear in chapter-3/step-2
    const diff = getRenderableVDOMDiff(renderableVDOM, vdom);

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

export const { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } = React;

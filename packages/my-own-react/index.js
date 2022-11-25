import * as React from '../../node_modules/react';
export { DOMHandlers } from './dom-handlers';
export default React;

import {
  getVDOMElement,
  setCurrentVDOMElement,
  createVDOMElement,
} from './vdom-helpers';
import { createHooks, useState } from './hooks';
export { useState };
import { getRenderableVDOMDiff } from './diff';

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
}

We can then create "pointer"s to access specific children based on their location in the tree, for example to access "Hello world!",
we need to dig into the first element's children picking the first child "span", then pick the second child from that element which is "Hello world!".
// So a pointer to it can look like:
const pointerToHelloWorld = [0, 1];
const element = getVDOMElement(pointerToHelloWorld, VDOM); // [`Hello world!`]
And you access the element itself by extracting taking the element from it, e.g.
const { element: button } = getVDOMElement([1]], VDOM); // button
*/

export const isPrimitiveElementFromJSX = element => typeof element !== 'object';

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

  setCurrentVDOMElement(
    VDOMPointer,
    createVDOMElement(element),
    VDOM,
  );

  if (typeof type === 'function') {
    const FunctionalComponent = type;

    hooks.registerHooks(VDOMPointer, isFirstRender);
    const renderedElement = FunctionalComponent({ children, ...props });
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
    const renderedChildren = childrenArray.map((child, index) =>
      render(child, VDOM, [...VDOMPointer, index], hooks),
    );
    return {
      ...element,
      props: {
        ...props,
        children: renderedChildren,
      },
      VDOMPointer,
    };
  }
  return { ...element, VDOMPointer };
};

const renderPrimitive = (value, VDOM, VDOMPointer) => {
  const VDOMElement = createVDOMElement(value, VDOMPointer);
  setCurrentVDOMElement(
    VDOMPointer,
    VDOMElement,
    VDOM,
  );
  return VDOMElement.element;
};

const render = (element, VDOM, VDOMPointer, hooks) =>
  isPrimitiveElementFromJSX(element)
    ? renderPrimitive(element, VDOM, VDOMPointer)
    : renderComponentElement(element, VDOM, VDOMPointer, hooks);

const rootRender = (element, hooks, vdom) => {
  let renderableVDOM = render(element, vdom, [], hooks);
  return renderableVDOM;
};

// this function will call the updateCallback on every state change
// so the DOM is re-rendered
export const startRenderSubscription = (element, updateCallback) => {
  let vdom = {
    previous: {},
    current: {},
  };
  const update = hooks => {
    const renderableVDOM = rootRender(element, hooks, vdom);

    // We calculate the diff between the renderableVDOM and the previous VDOM here
    const diff = getRenderableVDOMDiff(renderableVDOM, vdom);

    vdom.previous = vdom.current;
    vdom.current = [];

    updateCallback(renderableVDOM, diff);
  };
  const hooks = createHooks(update);
  update(hooks);
};

export const { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } = React;

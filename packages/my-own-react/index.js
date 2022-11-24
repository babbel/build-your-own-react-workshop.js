import * as React from '../../node_modules/react';
export { DOMHandlers } from './dom-handlers';
export default React;

import {
  setCurrentVDOMElement,
  createVDOMElement,
  createRenderableVDOMElement,
  createPrimitiveVDOMElement,
} from './vdom-helpers';

export const useState = initialState => [
  typeof initialState === 'function' ? initialState() : initialState,
  () => {},
];
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

const renderComponentElement = (element, VDOM, VDOMPointer) => {
  const {
    props: { children, ...props },
    type,
  } = element;
  const elementAsRenderableVDOMElement = createRenderableVDOMElement(
    props,
    type,
    VDOMPointer,
  );
  if (typeof type === 'function') {
    const FunctionalComponent = type;
    // START HERE
    // How can we render a functional component?
    // replace me
    return {
      type: 'primitive',
      value:
        'Your React cannot implement components yet. Checkout the renderComponentElement function',
    };
  }
  if (typeof children !== 'undefined') {
    const childrenArray = Array.isArray(children) ? children : [children];
    setCurrentVDOMElement(
      VDOMPointer,
      createVDOMElement(elementAsRenderableVDOMElement),
      VDOM,
    );
    const renderedChildren = childrenArray.map((child, index) =>
      render(child, VDOM, [...VDOMPointer, index]),
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

const render = (element, VDOM, VDOMPointer) =>
  isPrimitiveElementFromJSX(element)
    ? renderPrimitive(element, VDOM, VDOMPointer)
    : renderComponentElement(element, VDOM, VDOMPointer);

const rootRender = (element, vdom) => {
  let renderableVDOM = render(element, vdom, []);
  return renderableVDOM;
};

export const getRenderableVDOM = element => {
  let vdom = {
    current: {},
  };
  const renderableVDOM = rootRender(element, vdom);
  return renderableVDOM;
};

export const { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } = React;

import { startRenderSubscription } from '.';
import {
  isPrimitiveElement,
} from './vdom-helpers';

// should appear in chapter-1/step-3
const eventHandlersMap = {
  onClick: 'click',
  // for the `change` event to trigger, the user is required to leave the field and come back
  // so it seems like React decided to use the `input` event under the hood
  onChange: 'input',
  onSubmit: 'submit',
};
const isEventHandlerProp = key => Object.keys(eventHandlersMap).includes(key);
// should appear in chapter-1/step-3
const addEventHandler = (domElement, { key, value }) => {
  domElement.addEventListener(eventHandlersMap[key], value);
};

// should appear in chapter-1/step-3
const applyPropToHTMLElement = ({ key, value }, element) => {
  if (isEventHandlerProp(key)) {
    addEventHandler(element, { key, value });
    return;
  }
  element[key] = value;
};

const renderComponentElementToHtml = (
  { props: { children, ...props }, type }
) => {
  // should appear in chapter-1/step-2
  const domElement = document.createElement(type);
  // should appear in chapter-1/step-3
  Object.entries(props).forEach(([key, value]) => {
    applyPropToHTMLElement({ key, value }, domElement);
  });
  // should appear in chapter-1/step-6
  if (children) {
    const childrenAsDomElement = children.map(child =>
      renderElementToHtml(child),
    );
    childrenAsDomElement.forEach(childElement => {
      if (childElement) {
        domElement.appendChild(childElement);
      }
    });
  }
  // should appear in chapter-1/step-2
  return domElement;
};

// should appear in chapter-1/step-6
const renderPrimitiveToHtml = ({ value }) => {
  switch (typeof value) {
    case 'string':
    case 'number':
      return document.createTextNode(value);
    case 'undefined':
      return;
    case 'boolean':
      return value ? renderPrimitiveToHtml('true') : undefined;
    default:
      throw new Error(`Type ${value} is not a known renderable type.`);
  }
};

const renderElementToHtml = (element) => {
  const renderedElement = isPrimitiveElement(element)
    ? renderPrimitiveToHtml(element)
    : renderComponentElementToHtml(element);
  return renderedElement;
};

const createRoot = rootElement => ({
  rootElement,
  render: rootChild => {
    let lastChild;
    startRenderSubscription(rootChild, (renderableVDOM) => {
      let rootChildAsHTML;
      // update should appear in chapter-2/step-1
      if (!lastChild) {
        rootChildAsHTML = renderElementToHtml(renderableVDOM);
        rootElement.appendChild(rootChildAsHTML);
      } else {
        rootChildAsHTML = renderElementToHtml(renderableVDOM);
        rootElement.replaceChild(rootChildAsHTML, lastChild);
      }
      lastChild = rootChildAsHTML;
      /* version before chapter-2/step-1
     // should appear in chapter-1/step-2
      const rootChildAsHTML = renderElementToHtml(renderableVDOM);
      rootElement.appendChild(rootChildAsHTML);
     */
    });
  },
});

export const DOMHandlers = {
  createRoot,
};

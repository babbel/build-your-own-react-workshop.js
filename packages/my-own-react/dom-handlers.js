const isPrimitiveElement = element => typeof element !== 'object';

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
  if (children) {
    // START HERE
    // We should find a way to handle children here
  }
  // should appear in chapter-1/step-2
  return domElement;
};

// should appear in chapter-1/step-6
const renderPrimitiveToHtml = (value) => {
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
    const rootChildAsHTML = renderElementToHtml(rootChild);
    rootElement.appendChild(rootChildAsHTML);
  },
});

export const DOMHandlers = {
  createRoot,
};

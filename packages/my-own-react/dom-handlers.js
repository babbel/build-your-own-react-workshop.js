const isPrimitiveElement = element => typeof element !== 'object';

// map of eventHandlers that the ToDo app requires
const eventHandlersMap = {
  onClick: 'click',
  // for the `change` event to trigger, the user is required to leave the field and come back
  // so it seems like React decided to use the `input` event under the hood
  onChange: 'input',
  onSubmit: 'submit',
};
const isEventHandlerProp = key => Object.keys(eventHandlersMap).includes(key);

const addEventHandler = (domElement, { key, value }) => {
  domElement.addEventListener(eventHandlersMap[key], value);
};

const applyPropToHTMLElement = ({ key, value }, element) => {
  if (isEventHandlerProp(key)) {
    addEventHandler(element, { key, value });
    return;
  }
  if (element[key] !== undefined) {
    element[key] = value;
  } else {
    element.setAttribute(key, value);
  }
};

// expects a JSX element and returns an HTML element
const renderTagElementToHtml = ({ props: { children, ...props }, type }) => {
  const domElement = document.createElement(type);

  Object.entries(props).forEach(([key, value]) => {
    applyPropToHTMLElement({ key, value }, domElement);
  });
  if (children) {
    // START HERE
    // We should find a way to handle children here
  }

  return domElement;
};

const renderPrimitiveToHtml = value => {
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

const renderElementToHtml = element => {
  const renderedElement = isPrimitiveElement(element)
    ? renderPrimitiveToHtml(element)
    : renderTagElementToHtml(element);
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

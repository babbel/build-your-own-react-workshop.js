import { startRenderSubscription } from '.';

const jsStyleToCSSStyle = (styleObject) => {
  // const declaration = new CSSStyleDeclaration();
  const declaration = document.createElement('span').style;
  Object.entries(styleObject).forEach(([key, value]) => {
    // Fun fact: this doesn't take care of converting unitless to unit-based values
    // e.g. height: 100 becomes height: 100px in React, but not with this
    declaration[key] = value;
    if (declaration[key] === '' && value !== '') {
      throw new Error(`Invalid ${key}:${value} CSS`);
    }
  });
  return declaration.cssText;
}

const propToDomTransformers = {
  className: ({ value }) => ({ key: 'class', value }),
  style: ({ key, value }) => ({ key, value: jsStyleToCSSStyle(value) }),
};

const transformPropToDomProp = (prop) => {
  const transformer = propToDomTransformers[prop.key] || (p => p);
  return transformer(prop);
};

const isNonPrimitiveElement = (element) => typeof element === 'object' && element.type;

const eventHandlersProps = ['onClick', 'onChange', 'onSubmit'];

const addEventHandler = (domElement, { key, value }) => {
  switch (key) {
    case 'onClick':
      return domElement.addEventListener('click', value);
    case 'onChange':
      return domElement.addEventListener('input', value);
    case 'onSubmit':
      return domElement.addEventListener('submit', value);
  }
}

const booleanProps = ['disabled'];

const renderComponentElementToHtml = ({ props: { children, ...props }, type }) => {
  const domElement = document.createElement(type);
  Object.entries(props)
    .map(([key, value]) => transformPropToDomProp({ key, value }))
    .forEach(({ key, value }) => {
      if (eventHandlersProps.includes(key)) {
        addEventHandler(domElement, { key, value });
        return;
      }
      if (booleanProps.includes(key) && !value) {
        return;
      }
      domElement.setAttribute(key, value);
    });
  if (children) {
    const childrenAsDomElement = children.map(child => renderElementToHtml(child));
    childrenAsDomElement.forEach(childElement => {
      if (childElement) {
        domElement.appendChild(childElement);
      }
    });
  }
  return domElement;
}

const renderPrimitiveToHtml = primitiveType => {
  switch (typeof primitiveType) {
    case 'string':
    case 'number':
      return document.createTextNode(primitiveType);
    case 'undefined':
      return;
    case 'boolean':
      return primitiveType ? renderPrimitiveToHtml('true') : undefined;
    default:
      throw new Error(`Type ${primitiveType} is not a known renderable type.`);
  }
}

const renderElementToHtml = element => isNonPrimitiveElement(element) ? renderComponentElementToHtml(element) : renderPrimitiveToHtml(element);

// TODO :: think about the first render
const getActualRenderedElementByDOMPointer = (root, domPointer) => {
  return domPointer.reduce((elementTree, childIndex) => {
    return elementTree.children[childIndex];
  }, root);
};

const createRoot = (rootElement) => ({
  rootElement,
  render: (rootChild) => {
    let lastChild;
    startRenderSubscription(rootChild, (rootChildDom, diff) => {
      // to be able to test getElementByDOMPointer func
      const domElements = Object.keys(diff).map((vdomPointer) => {
        const { domPointer } = diff[vdomPointer];
        return getActualRenderedElementByDOMPointer(rootElement, domPointer);
      });
      console.log('domElements: ', domElements);

      const rootChildAsHTML = renderElementToHtml(rootChildDom);
      if (!lastChild) {
        rootElement.appendChild(rootChildAsHTML);
      } else {
        rootElement.replaceChild(rootChildAsHTML, lastChild);
      }
      lastChild = rootChildAsHTML;
    });
  }
});

export const DOMHandlers = {
  createRoot
};

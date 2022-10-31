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

const renderComponentElementToHtml = ({ props: { children, ...props }, type }) => {
  if (typeof type === 'function') {
    const result = type({ children, ...props });
    return renderElementToHtml(result);
  }
  const domElement = document.createElement(type);
  const childrenArray = Array.isArray(children) ? children : [children];
  const childrenAsDomElement = childrenArray.map(child => renderElementToHtml(child));
  Object.entries(props)
    .map(([key, value]) => transformPropToDomProp({ key, value }))
    .forEach(({key, value}) => {
      domElement.setAttribute(key, value);
    });
  childrenAsDomElement.forEach(childElement => {
    if (childElement) {
      domElement.appendChild(childElement);
    }
  });
  return domElement;
}

const renderPrimitiveToHtml = primitiveType => {
  switch (typeof primitiveType) {
    case 'string':
      return document.createTextNode(primitiveType);
    case 'undefined':
      return;
    default:
      throw new Error(`Type ${primitiveType} is not a known renderable type.`);
  }
}

const renderElementToHtml = element => isNonPrimitiveElement(element) ? renderComponentElementToHtml(element) : renderPrimitiveToHtml(element);

const createRoot = (rootElement) => ({
  rootElement,
  render: (rootChild) => {
    const rootChildAsHTML = renderElementToHtml(rootChild);
    rootElement.appendChild(rootChildAsHTML);
  }
});

export const DOMHandlers = {
  createRoot
};

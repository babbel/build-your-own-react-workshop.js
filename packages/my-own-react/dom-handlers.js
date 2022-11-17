import { startRenderSubscription } from '.';

// should appear in chapter-1/step-5
const jsStyleToCSSStyle = (styleObject) => {
  // const declaration = new CSSStyleDeclaration();
  const declaration = document.createElement('span').style;
  Object.entries(styleObject).forEach(([key, value]) => {
    // Fun fact: this doesn't take care of converting unitless to unit-based values
    // e.g. height: 100 becomes height: 100px in React, but not with this. Instead,
    // we are throwing errors for the key-value pairs that can't be directly used
    // as a CSS property and value.
    declaration[key] = value;
    if (declaration[key] === '' && value !== '') {
      throw new Error(`Invalid ${key}:${value} CSS`);
    }
  });
  return declaration.cssText;
}

// should appear in chapter-1/step-4
const propToDomTransformers = {
  className: ({ value }) => ({ key: 'class', value }),
  // should appear in chapter-1/step-5
  style: ({ key, value }) => ({ key, value: jsStyleToCSSStyle(value) }),
};

// should appear in chapter-1/step-4
const transformPropToDomProp = (prop) => {
  const transformer = propToDomTransformers[prop.key] || (p => p);
  return transformer(prop);
};

// should appear in chapter-2/step-1
const isNonPrimitiveElement = (element) => element.type !== 'primitive';
// should appear in chapter-1/step-6
// const isNonPrimitiveElement = (element) => element.type !== 'primitive';

// should appear in chapter-1/step-3
const eventHandlersProps = ['onClick', 'onChange', 'onSubmit'];
// should appear in chapter-1/step-3
const addEventHandler = (domElement, { key, value }) => {
  switch (key) {
    case 'onClick':
      return domElement.addEventListener('click', value);
    case 'onChange':
      // for the `change` event to trigger, the user is required to leave the field and come back
      // so it seems like React decided to use the `input` event under the hood
      return domElement.addEventListener('input', value);
    case 'onSubmit':
      return domElement.addEventListener('submit', value);
  }
}

// should appear in chapter-4/step-1
const removeEventHandler = (domElement, { key, value }) => {
  switch (key) {
    case 'onClick':
      return domElement.removeEventListener('click', value);
    case 'onChange':
      // for the `change` event to trigger, the user is required to leave the field and come back
      // so it seems like React decided to use the `input` event under the hood
      return domElement.removeEventListener('input', value);
    case 'onSubmit':
      return domElement.removeEventListener('submit', value);
  }
}


// should appear in chapter-1/step-3
const booleanProps = ['disabled'];

// should appear in chapter-1/step-3
const applyPropToHTMLElement = (prop, element) => {
  // should appear in chapter-1/step-4
  const domProp = transformPropToDomProp(prop);
  const { key, value } = domProp;
  if (eventHandlersProps.includes(key)) {
    addEventHandler(element, { key, value });
    return;
  }
  // Boolean props in the browser don't understand `false` as a value, so
  // for example disabled="false" technically makes the `disabled` property true 💀 
  if (booleanProps.includes(key) && !value) {
    element.removeAttribute(key);
    return;
  }
  element.setAttribute(key, value);
}

// should appear in chapter-4/step-1
const removePropFromHTMLElement = (prop, element) => {
  const domProp = transformPropToDomProp(prop);
  if (eventHandlersProps.includes(key)) {
    removeEventHandler(renderedElementsMap[VDOMPointer], { key, value: oldValue });
  }
  element.removeAttribute(domProp);
};

// renderedElementsMap should appear in chapter-4/step-1
const renderComponentElementToHtml = ({ props: { children, ...props }, type }, renderedElementsMap) => {
  // should appear in chapter-1/step-2
  const domElement = document.createElement(type);
  // should appear in chapter-1/step-3
  Object.entries(props)
    .forEach(([ key, value ]) => {
      applyPropToHTMLElement({ key, value }, domElement);
    });
  // should appear in chapter-1/step-6
  if (children) {
    const childrenAsDomElement = children.map(child => renderElementToHtml(child, renderedElementsMap));
    childrenAsDomElement.forEach(childElement => {
      if (childElement) {
        domElement.appendChild(childElement);
      }
    });
  }
  // should appear in chapter-1/step-2
  return domElement;
}

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
}

// renderedElementsMap should appear in chapter-4/step-1
const renderElementToHtml = (element, renderedElementsMap) => {
  const renderedElement = isNonPrimitiveElement(element) ?
    renderComponentElementToHtml(element, renderedElementsMap) :
    renderPrimitiveToHtml(element);
  renderedElementsMap[element.VDOMPointer] = renderedElement;
  return renderedElement;
};

// Should appear in chapter-4/step-1
const applyDiffItem = (VDOMPointer, [diffItemType, diffItemPayload], renderedElementsMap, dom) => {
  // node_added, node_removed, node_replaced, node_innerTextUpdate, props: removed | updated
  switch (diffItemType) {
    case 'props':
      Object.entries(diffItemPayload).forEach(([key, [propDiffType, { oldValue, newValue }]]) => {
        // TODO: needs to handle prop removed
        if (propDiffType === 'updated') {
          if (eventHandlersProps.includes(key)) {
            removeEventHandler(renderedElementsMap[VDOMPointer], { key, value: oldValue });
          }
          applyPropToHTMLElement({ key, value: newValue }, renderedElementsMap[VDOMPointer]);
        } else if (propDiffType === 'removed') {
          removePropFromHTMLElement({ key }, renderedElementsMap[VDOMPointer]);
        }
      });
      break;
    case 'node_removed':
      const elementToRemove = renderedElementsMap[VDOMPointer];
      if (elementToRemove) {
        elementToRemove.parentNode.removeChild(elementToRemove);
      } /* else {
        Object.entries(renderedElementsMap).filter(([pointer]) => {
          // for a pointer to a component at 0,1,2
          // and rendered children 0,1,2,0 and 0,1,2,1
          // we want to remove those children
          return new RegExp(`${VDOMPointer},\\d+$`).test(pointer);
        }).forEach(([_, element]) => {
          element.parentNode.removeChild(element);
        });
      }*/
      break;
    case 'node_added':
      // This addedNode idea is not great for now
      // as this can be a component, which we don't know how to handle from DOM handlers
      // so instead we probably need to find the correct children from the DOM passed by startSubscription callback
      // similarly to the remove above.
      const { node, parentPointer } = diffItemPayload;
      const addedElement = renderElementToHtml(node, renderedElementsMap);
      const insertionIndex = VDOMPointer[VDOMPointer.length - 1];

      /*

        <App>
          <div>
            <Component>
              <div>
                <Component>
                  <span>First child</span>
                  <span>Second child</span>
                </Component>
                <span>Hello world!</span>
              </div>
            </Component>
          </div>
        </App>

        <div> [0]
          <div> [0, 0, 0]
            <span>First child</span> [0, 0, 0, 0, 0]
            <span>Second child</span> [0, 0, 0, 0, 1]
            <span>Hello world!</span> [0, 0, 0, 1]
          </div>
        </div>

        diff [0, 0, 0, 1]: ['node_added', { element: { type: span }, VDOMPointer: [0, 0, 0, 1] }]

        DOM: [0, 0, 0]
      */
      // const parentIndex = VDOMPointer.slice(0, -1);
      // TODO: this parentIndex might not be a rendered element but a component
      // in this case we should find the closest rendered element parent that fits
      const parentElement = renderedElementsMap[parentPointer];



      const nextSibling = parentElement.children[insertionIndex];  
      parentElement.insertBefore(addedElement, nextSibling);
      break;
    case 'node_innerTextUpdate':
      const textNode = diffItemPayload;
      renderedElementsMap[textNode.VDOMPointer].nodeValue = textNode.value;
      break;
  }
}

// Should appear in chapter-4/step-1
const applyDiff = (diff, renderedElementsMap, dom) => {
  // We need to order the diff items by their types, node_removed, node_added, node_replaced, the rest
  Object.entries(diff).forEach(([VDOMPointer, diffItem]) => applyDiffItem(VDOMPointer, diffItem, renderedElementsMap, dom));
};

const createRoot = (rootElement) => ({
  rootElement,
  render: (rootChild) => {
    // should appear in chapter-2/step-1
    // let lastChild;
    // Should appear in chapter-4/step-1
    let renderedElementsMap = {};
    // Should appear in chapter-4/step-1
    startRenderSubscription(rootChild, (rootChildDom, diff) => {
    // startRenderSubscription(rootChild, (rootChildDom) => {
      // Should appear in chapter-4/step-1
      if (Object.keys(renderedElementsMap).length === 0) {
        const rootChildAsHTML = renderElementToHtml(rootChildDom, renderedElementsMap);
        rootElement.appendChild(rootChildAsHTML);
      } else {
        applyDiff(diff, renderedElementsMap, rootChildDom);
      }

      /* version before chapter-4/step-1
      // update should appear in chapter-2/step-1
        if (!lastChild) {
          const rootChildAsHTML = renderElementToHtml(rootChildDom);
          rootElement.appendChild(rootChildAsHTML);
        } else {
          const rootChildAsHTML = renderElementToHtml(rootChildDom, renderedElementsMap);
          rootElement.replaceChild(rootChildAsHTML, lastChild);
        }
        lastChild = rootChildAsHTML;
      */
     /* version before chapter-2/step-1
     // should appear in chapter-1/step-2
      const rootChildAsHTML = renderElementToHtml(rootChildDom);
      rootElement.appendChild(rootChildAsHTML);
     */
    });
  }
});

export const DOMHandlers = {
  createRoot
};

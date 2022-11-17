import { startRenderSubscription } from '.';

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

const propToDomTransformers = {
  className: ({ value }) => ({ key: 'class', value }),
  style: ({ key, value }) => ({ key, value: jsStyleToCSSStyle(value) }),
};

const transformPropToDomProp = (prop) => {
  const transformer = propToDomTransformers[prop.key] || (p => p);
  return transformer(prop);
};

const isNonPrimitiveElement = (element) => element.type !== 'primitive';

const eventHandlersProps = ['onClick', 'onChange', 'onSubmit'];

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


const booleanProps = ['disabled'];

const applyPropToHTMLElement = (prop, element) => {
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

const removePropFromHTMLElement = (prop, element) => {
  const domProp = transformPropToDomProp(prop);
  if (eventHandlersProps.includes(key)) {
    removeEventHandler(renderedElementsMap[VDOMPointer], { key, value: oldValue });
  }
  element.removeAttribute(domProp);
};

const renderComponentElementToHtml = ({ props: { children, ...props }, type }, renderedElementsMap) => {
  const domElement = document.createElement(type);
  Object.entries(props)
    .forEach(([ key, value ]) => {
      applyPropToHTMLElement({ key, value }, domElement);
    });
  if (children) {
    const childrenAsDomElement = children.map(child => renderElementToHtml(child, renderedElementsMap));
    childrenAsDomElement.forEach(childElement => {
      if (childElement) {
        domElement.appendChild(childElement);
      }
    });
  }
  return domElement;
}

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

const renderElementToHtml = (element, renderedElementsMap) => {
  const renderedElement = isNonPrimitiveElement(element) ?
    renderComponentElementToHtml(element, renderedElementsMap) :
    renderPrimitiveToHtml(element);
  renderedElementsMap[element.VDOMPointer] = renderedElement;
  return renderedElement;
};

// TODO :: think about the first render
const getActualRenderedElementByDOMPointer = (root, domPointer) => {
  return domPointer.reduce((elementTree, childIndex) => {
    return elementTree.children[childIndex];
  }, root);
};

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

const applyDiff = (diff, renderedElementsMap, dom) => {
  // We need to order the diff items by their types, node_removed, node_added, node_replaced, the rest
  Object.entries(diff).forEach(([VDOMPointer, diffItem]) => applyDiffItem(VDOMPointer, diffItem, renderedElementsMap, dom));
};

const createRoot = (rootElement) => ({
  rootElement,
  render: (rootChild) => {
    // let lastChild;
    let renderedElementsMap = {};
    console.log(rootChild);
    startRenderSubscription(rootChild, (rootChildDom, diff) => {
      console.log(diff);
      // to be able to test getElementByDOMPointer func
      /*const domElements = Object.keys(diff).map((vdomPointer) => {
        const { domPointer } = diff[vdomPointer];
        return getActualRenderedElementByDOMPointer(rootElement, domPointer);
      });
      console.log('domElements: ', domElements);
      */
      // console.log(renderedElementsMap);
      if (Object.keys(renderedElementsMap).length === 0) {
        const rootChildAsHTML = renderElementToHtml(rootChildDom, renderedElementsMap);
        rootElement.appendChild(rootChildAsHTML);
      } else {
        // rootElement.replaceChild(rootChildAsHTML, lastChild);
        applyDiff(diff, renderedElementsMap, rootChildDom);
      }
      // lastChild = rootChildAsHTML;
    });
  }
});

export const DOMHandlers = {
  createRoot
};

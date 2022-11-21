import { startRenderSubscription } from '.';
import {
  findRenderableByVDOMPointer,
  isChildVDOMPointer,
  findRootVDOMPointers,
  isPrimitiveElement
} from './vdom-helpers';

// should appear in chapter-1/step-3
const eventHandlersMap = {
  onClick: 'click',
  // for the `change` event to trigger, the user is required to leave the field and come back
  // so it seems like React decided to use the `input` event under the hood
  onChange: 'input',
  onSubmit: 'submit',
};
const isEventHandlerProp = (key) => Object.keys(eventHandlersMap).includes(key);
// should appear in chapter-1/step-3
const addEventHandler = (domElement, { key, value }) => {
  domElement.addEventListener(eventHandlersMap[key], value);
}

// should appear in chapter-4/step-1
const removeEventHandler = (domElement, { key, value }) => {
  domElement.removeEventListener(eventHandlersMap[key], value);
}

// should appear in chapter-1/step-3
const applyPropToHTMLElement = ({ key, value }, element) => {
  if (isEventHandlerProp(key)) {
    addEventHandler(element, { key, value });
    return;
  }
  element[key] = value;
}

// should appear in chapter-4/step-1
const removePropFromHTMLElement = ({ key, oldValue }, element) => {
  if (isEventHandlerProp(key)) {
    removeEventHandler(renderedElementsMap[VDOMPointer], { key, oldValue });
    return;
  }
  element.removeAttribute(key);
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
  const renderedElement = isPrimitiveElement(element) ?
    renderPrimitiveToHtml(element) :
    renderComponentElementToHtml(element, renderedElementsMap);
  renderedElementsMap[element.VDOMPointer] = renderedElement;
  return renderedElement;
};


// should appear in chapter-4/step-1
const findRenderedChildrenByVDOMPointer = (renderedElementsMap, VDOMPointer) => {
  return Object.entries(renderedElementsMap).filter(([pointer]) => isChildVDOMPointer(pointer, VDOMPointer));
};

// should appear in chapter-4/step-1
const applyNodeRemoved = ({ renderedElementsMap }, { VDOMPointer }) => {
  const elementToRemove = renderedElementsMap[VDOMPointer];
  if (elementToRemove) {
    elementToRemove.parentNode.removeChild(elementToRemove);
    findRenderedChildrenByVDOMPointer(renderedElementsMap, VDOMPointer).forEach(([pointer]) => {
      delete renderedElementsMap[pointer];
    });
  } else {
    // for a pointer to a component at 0,1,2
    // and rendered children 0,1,2,0 and 0,1,2,1,0
    // we want to remove those children
    const allChildren = findRenderedChildrenByVDOMPointer(renderedElementsMap, VDOMPointer);
    const rootVDOMPointers = findRootVDOMPointers(allChildren.map(([pointer]) => pointer));
    rootVDOMPointers.forEach((pointer) => {
      applyNodeRemoved({ renderedElementsMap }, { VDOMPointer: pointer });
    });
  }
  delete renderedElementsMap[VDOMPointer];
}

// should appear in chapter-4/step-1
const applyNodeAdded = ({ renderedElementsMap, renderableVDOM }, { VDOMPointer, payload: { node, parentPointer } }) => {
      /*
        VDOM
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

        renderableVDOM (with VDOMPointer)
        <div> [0]
          <div> [0, 0, 0]
            <span>First child</span> [0, 0, 0, 0, 0]
            <span>Second child</span> [0, 0, 0, 0, 1]
            <span>Hello world!</span> [0, 0, 0, 1]
          </div>
        </div>

        diff [0, 0, 0, 1]: ['node_added', { element: { type: span }, VDOMPointer: [0, 0, 0, 1] }]

        renderableVDOM parent: [0, 0, 0]
        renderableVDOM next sibling: [0, 0, 0, 0, 1]
      */
      const addedElement = renderElementToHtml(node, renderedElementsMap);
      // The addedElement could be a value that doesn't render to the DOM such as `false`
      if (!addedElement) {
        renderedElementsMap[VDOMPointer] = addedElement;
        return;
      }
      const parentElement = renderedElementsMap[parentPointer];
      const parentElementFromrenderableVDOM = findRenderableByVDOMPointer(renderableVDOM, parentPointer);
      const elementRealVDOMIndex = parentElementFromrenderableVDOM.props.children.findIndex(child => child.VDOMPointer === VDOMPointer);
      let nextSiblingVDOMIndex = elementRealVDOMIndex - 1;
      let nextSibling;
      // The next sibling could be a value that doesn't render to the DOM such as `false`
      // so we need to continue searching for the first rendered one here
      while (nextSiblingVDOMIndex > 0 && nextSibling === undefined) {
        const nextSiblingFromVDOM = parentElementFromrenderableVDOM.props.children[nextSiblingVDOMIndex];
        if (nextSiblingFromVDOM) {
          nextSibling = renderedElementsMap[nextSiblingFromVDOM.VDOMPointer];
        }
        nextSiblingVDOMIndex -= 1;
      }
      parentElement.insertBefore(addedElement, nextSibling);
      renderedElementsMap[VDOMPointer] = addedElement;
}

// should appear in chapter-4/step-1
const applyNodeReplaced = ({ renderedElementsMap, renderableVDOM }, { VDOMPointer, payload: { newNode, oldNode, parentPointer } }) => {
  applyNodeRemoved({ renderedElementsMap, renderableVDOM }, { VDOMPointer, payload: { parentPointer } });
  applyNodeAdded({ renderedElementsMap, renderableVDOM }, { VDOMPointer, payload: { node: newNode, parentPointer } });
};

// should appear in chapter-4/step-1
const applyNodeInnerTextUpdate = ({ renderedElementsMap }, { VDOMPointer, payload: { newElement }}) => {
  renderedElementsMap[VDOMPointer].nodeValue = newElement.value;
}

// should appear in chapter-4/step-1
const applyProps = ({ renderedElementsMap }, { VDOMPointer, payload: propsChanged }) => {
  Object.entries(propsChanged).forEach(([key, [propDiffType, { oldValue, newValue }]]) => {
    if (propDiffType === 'updated') {
      if (isEventHandlerProp(key)) {
        removeEventHandler(renderedElementsMap[VDOMPointer], { key, value: oldValue });
      }
      applyPropToHTMLElement({ key, value: newValue }, renderedElementsMap[VDOMPointer]);
    } else if (propDiffType === 'removed') {
      removePropFromHTMLElement({ key, oldValue }, renderedElementsMap[VDOMPointer]);
    }
  });
}

// should appear in chapter-4/step-1
const diffApplicators = {
  node_removed: applyNodeRemoved,
  node_added: applyNodeAdded,
  node_replaced: applyNodeReplaced,
  node_innerTextUpdate: applyNodeInnerTextUpdate,
  props: applyProps,
}

// Should appear in chapter-4/step-1
const diffApplicationOrder = ['node_removed', 'node_added', 'node_replaced', 'node_innerTextUpdate', 'props'];

// Should appear in chapter-4/step-1
const applyDiff = (diff, renderedElementsMap, renderableVDOM) => {
  const sortedDiffs = diff.sort((a, b) => diffApplicationOrder.indexOf(a.type) - diffApplicationOrder.indexOf(b.type));
  sortedDiffs.forEach(diffItem => diffApplicators[diffItem.type]({ renderedElementsMap, renderableVDOM }, diffItem));
};

const createRoot = (rootElement) => ({
  rootElement,
  render: (rootChild) => {
    // should appear in chapter-2/step-1
    // let lastChild;
    // Should appear in chapter-4/step-1
    let renderedElementsMap = {};
    // Should appear in chapter-4/step-1
    startRenderSubscription(rootChild, (renderableVDOM, diff) => {
    // startRenderSubscription(rootChild, (renderableVDOM) => {
      // Should appear in chapter-4/step-1
      if (Object.keys(renderedElementsMap).length === 0) {
        const rootChildAsHTML = renderElementToHtml(renderableVDOM, renderedElementsMap);
        rootElement.appendChild(rootChildAsHTML);
      } else {
        applyDiff(diff, renderedElementsMap, renderableVDOM);
      }
      /* version before chapter-4/step-1
      // update should appear in chapter-2/step-1
        if (!lastChild) {
          const rootChildAsHTML = renderElementToHtml(renderableVDOM);
          rootElement.appendChild(rootChildAsHTML);
        } else {
          const rootChildAsHTML = renderElementToHtml(renderableVDOM, renderedElementsMap);
          rootElement.replaceChild(rootChildAsHTML, lastChild);
        }
        lastChild = rootChildAsHTML;
      */
     /* version before chapter-2/step-1
     // should appear in chapter-1/step-2
      const rootChildAsHTML = renderElementToHtml(renderableVDOM);
      rootElement.appendChild(rootChildAsHTML);
     */
    });
  }
});

export const DOMHandlers = {
  createRoot
};

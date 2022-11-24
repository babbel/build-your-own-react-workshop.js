import { startRenderSubscription } from '.';
import {
  findRenderableByVDOMPointer,
  isChildVDOMPointer,
  findRootVDOMPointers,
  isPrimitiveElement,
} from './vdom-helpers';
import { diffType, propsDiffType, diffApplicationOrder } from './diff';

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

const removeEventHandler = (domElement, { key, value }) => {
  domElement.removeEventListener(eventHandlersMap[key], value);
};

const applyPropToHTMLElement = ({ key, value }, element) => {
  if (isEventHandlerProp(key)) {
    addEventHandler(element, { key, value });
    return;
  }
  element[key] = value;
};

const removePropFromHTMLElement = ({ key, oldValue }, element) => {
  if (isEventHandlerProp(key)) {
    removeEventHandler(renderedElementsMap[VDOMPointer], { key, oldValue });
    return;
  }
  element.removeAttribute(key);
};

// expects a JSX element and returns an HTML element
const renderTagElementToHtml = (
  { props: { children, ...props }, type },
  renderedElementsMap,
) => {
  const domElement = document.createElement(type);

  Object.entries(props).forEach(([key, value]) => {
    applyPropToHTMLElement({ key, value }, domElement);
  });

  if (children) {
    const childrenAsDomElement = children.map(child =>
      renderElementToHtml(child, renderedElementsMap),
    );
    childrenAsDomElement.forEach(childElement => {
      if (childElement) {
        domElement.appendChild(childElement);
      }
    });
  }

  return domElement;
};

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

const renderElementToHtml = (element, renderedElementsMap) => {
  const renderedElement = isPrimitiveElement(element)
    ? renderPrimitiveToHtml(element)
    : renderTagElementToHtml(element, renderedElementsMap);
  renderedElementsMap[element.VDOMPointer] = renderedElement;
  return renderedElement;
};

const findRenderedChildrenByVDOMPointer = (
  renderedElementsMap,
  VDOMPointer,
) => {
  return Object.entries(renderedElementsMap).filter(([pointer]) =>
    isChildVDOMPointer(pointer, VDOMPointer),
  );
};

const findNextSiblingOfVDOMPointer = (
  { renderedElementsMap, renderableVDOM },
  VDOMPointer,
  parentPointer,
) => {
  /*
        Given the following VDOM
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

        we get the following renderableVDOM (with VDOMPointer)
        <div> [0]
          <div> [0, 0, 0]
            <span>First child</span> [0, 0, 0, 0, 0]
            <span>Second child</span> [0, 0, 0, 0, 1]
            <span>Hello world!</span> [0, 0, 0, 1]
          </div>
        </div>

        So that the sibling of VDOMPointer [0, 0, 0, 1] in the renderableVDOM
        is the span Second child with VDOMPointer [0, 0, 0, 0, 1]
  */
  const parentElementFromRenderableVDOM = findRenderableByVDOMPointer(
    renderableVDOM,
    parentPointer,
  );
  const parentChildren = parentElementFromRenderableVDOM.props.children;
  const childVDOMIndex = parentChildren.findIndex(
    child => child.VDOMPointer === VDOMPointer,
  );
  let nextSiblingVDOMIndex = childVDOMIndex + 1;
  let nextSibling;
  // The next sibling could be a value that doesn't render to the DOM such as `false`
  // or a sibling that has not yet been rendered to the DOM (if it was added in the same update cycle)
  // so we need to continue searching for the first rendered one here
  while (
    nextSiblingVDOMIndex < parentChildren.length &&
    nextSibling === undefined
  ) {
    const nextSiblingFromVDOM =
      parentElementFromRenderableVDOM.props.children[nextSiblingVDOMIndex];
    if (nextSiblingFromVDOM) {
      nextSibling = renderedElementsMap[nextSiblingFromVDOM.VDOMPointer];
    }
    nextSiblingVDOMIndex += 1;
  }
  return nextSibling;
};

const applyNodeRemoved = ({ renderedElementsMap }, { VDOMPointer }) => {
  const elementToRemove = renderedElementsMap[VDOMPointer];
  if (elementToRemove) {
    elementToRemove.parentNode.removeChild(elementToRemove);
    findRenderedChildrenByVDOMPointer(renderedElementsMap, VDOMPointer).forEach(
      ([pointer]) => {
        delete renderedElementsMap[pointer];
      },
    );
  } else {
    // for a pointer to a component at 0,1,2
    // and rendered children 0,1,2,0 and 0,1,2,1,0
    // we want to remove those children
    const allChildren = findRenderedChildrenByVDOMPointer(
      renderedElementsMap,
      VDOMPointer,
    );
    const rootVDOMPointers = findRootVDOMPointers(
      allChildren.map(([pointer]) => pointer),
    );
    rootVDOMPointers.forEach(pointer => {
      applyNodeRemoved({ renderedElementsMap }, { VDOMPointer: pointer });
    });
  }
  delete renderedElementsMap[VDOMPointer];
};

const applyNodeAdded = (
  { renderedElementsMap, renderableVDOM },
  { VDOMPointer, payload: { node, parentPointer } },
) => {
  const parentElement = renderedElementsMap[parentPointer];
  const nextSibling = findNextSiblingOfVDOMPointer(
    { renderedElementsMap, renderableVDOM },
    VDOMPointer,
    parentPointer,
  );
  const addedElement = renderElementToHtml(node, renderedElementsMap);
  // The addedElement could be a value that doesn't render to the DOM such as `false`
  if (!addedElement) {
    renderedElementsMap[VDOMPointer] = addedElement;
    return;
  }
  parentElement.insertBefore(addedElement, nextSibling);
  renderedElementsMap[VDOMPointer] = addedElement;
};

const applyNodeReplaced = (
  { renderedElementsMap, renderableVDOM },
  { VDOMPointer, payload: { newNode, oldNode, parentPointer } },
) => {
  applyNodeRemoved(
    { renderedElementsMap, renderableVDOM },
    { VDOMPointer, payload: { parentPointer } },
  );
  applyNodeAdded(
    { renderedElementsMap, renderableVDOM },
    { VDOMPointer, payload: { node: newNode, parentPointer } },
  );
};

const applyPrimitiveNodeUpdate = (
  { renderedElementsMap },
  { VDOMPointer, payload: { newElement } },
) => {
  renderedElementsMap[VDOMPointer].nodeValue = newElement.value;
};

const applyProps = (
  { renderedElementsMap },
  { VDOMPointer, payload: propsChanged },
) => {
  Object.entries(propsChanged).forEach(
    ([key, [propDiffType, { oldValue, newValue }]]) => {
      if (propDiffType === propsDiffType.updated) {
        if (isEventHandlerProp(key)) {
          removeEventHandler(renderedElementsMap[VDOMPointer], {
            key,
            value: oldValue,
          });
        }
        applyPropToHTMLElement(
          { key, value: newValue },
          renderedElementsMap[VDOMPointer],
        );
      } else if (propDiffType === propsDiffType.removed) {
        removePropFromHTMLElement(
          { key, oldValue },
          renderedElementsMap[VDOMPointer],
        );
      }
    },
  );
};

const diffApplicators = {
  [diffType.nodeRemoved]: applyNodeRemoved,
  [diffType.nodeAdded]: applyNodeAdded,
  [diffType.nodeReplaced]: applyNodeReplaced,
  [diffType.primitiveNodeUpdate]: applyPrimitiveNodeUpdate,
  [diffType.props]: applyProps,
};

const applyDiff = (diff, renderedElementsMap, renderableVDOM) => {
  const sortedDiffs = diff.sort(
    (a, b) =>
      diffApplicationOrder.indexOf(a.type) -
      diffApplicationOrder.indexOf(b.type),
  );
  sortedDiffs.forEach(diffItem =>
    diffApplicators[diffItem.type](
      { renderedElementsMap, renderableVDOM },
      diffItem,
    ),
  );
};

const createRoot = rootElement => ({
  rootElement,
  render: rootChild => {
    let renderedElementsMap = {};

    startRenderSubscription(rootChild, (renderableVDOM, diff) => {
      if (Object.keys(renderedElementsMap).length === 0) {
        const rootChildAsHTML = renderElementToHtml(
          renderableVDOM,
          renderedElementsMap,
        );
        rootElement.appendChild(rootChildAsHTML);
      } else {
        applyDiff(diff, renderedElementsMap, renderableVDOM);
      }
    });
  },
});

export const DOMHandlers = {
  createRoot,
};

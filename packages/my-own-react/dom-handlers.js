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
  if (element[key] !== undefined) {
    element[key] = value;
  } else {
    element.setAttribute(key, value);
  }
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

/*
  This is a helper function to find rendered children pertaining to a specific VDOMPointer
  It is especially useful to find children of a component, as the component itself is not rendered
  within the browser's DOM, it makes retrieving its children a non-trivial exercise.
  Input:
  - renderedElementsMap: a map with keys VDOMPointer and values elements rendered in the browser
  - VDOMPointer: pointer to the element (most useful for a component) which children you want to retrieve
  Output:
  - renderedChildren: an array of all the children rendered to the browser's DOM for the element at the provided pointer
*/
const findRenderedChildrenByVDOMPointer = (
  renderedElementsMap,
  VDOMPointer,
) => {
  return Object.entries(renderedElementsMap).filter(([pointer]) =>
    isChildVDOMPointer(pointer, VDOMPointer),
  );
};

/* 
  This is a helper function to retrieve the insertion point of an element within the
  browser's DOM (which isn't trivial, as some elements such as `false` or `undefined` are part of the
  renderable VDOM, but not part of the actual DOM).
  Input
  - {
    renderedElementsMap: a map with keys VDOMPointer and values elements rendered in the browser
    renderableVDOM: the renderableVDOM for the current update cycle
  }
  - VDOMPointer: the pointer to the element for which we want to find the next sibling
  - parentPointer: the pointer to the parent of the VDOMPointer and the sibling
  Output
  - The next sibling of the VDOMPointer: a dom element currently rendered in the browser if found, undefined 
    if the node pointed by the VDOMPointer is the last rendered child of the parent
*/
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

/*
  Function to apply to the browser's DOM a node removed diff item
  Input:
  - {
    renderedElementsMap: a map with keys VDOMPointer and values elements rendered in the browser
  }
  - VDOMPointer: the pointer to the position for the node that should be removed
  Side effects:
  Removes the node from the browser's DOM, updates the renderedElementsMap to reflect the changes
*/
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

/*
  Function to apply to the browser's DOM a node added diff item
  Input:
  - {
    renderedElementsMap: a map with keys VDOMPointer and values elements rendered in the browser
    renderableVDOM: the renderableVDOM for the current update cycle
  }
  - VDOMPointer: the pointer to the position at which we want to insert the node
  - node: the renderableVDOMElement we want to insert into the DOM
  - parentPointer: the pointer to the parent of the VDOMPointer and the sibling
  Side effects:
  Updates the browser's DOM with the newly added node as well as the reference in the renderedElementsMap.
*/
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

/*
  Function to apply to the browser's DOM a node replaced diff item
  Input:
  - {
    renderedElementsMap: a map with keys VDOMPointer and values elements rendered in the browser
    renderableVDOM: the renderableVDOM for the current update cycle
  }
  - VDOMPointer: the pointer to the position at which we want to replace the node
  - newNode: the renderableVDOMElement we want the old node to be replaced with
  - parentPointer: the pointer to the parent of the VDOMPointer
  Side effects:
  Replace the node old node with the node newNode in the browser's DOM, 
  updates the renderedElementsMap to reflect the changes
*/
const applyNodeReplaced = (
  { renderedElementsMap, renderableVDOM },
  { VDOMPointer, payload: { newNode, parentPointer } },
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

/*
  Function to apply to the browser's DOM a primitive node update diff item
  Input:
  - {
    renderedElementsMap: a map with keys VDOMPointer and values elements rendered in the browser
  }
  - VDOMPointer: the pointer to the position at which we want to insert the node
  - newElement: the renderableVDOMElement primitive element we want to update the browser's DOM with
  Side effects:
  Updates the browser's DOM
*/
const applyPrimitiveNodeUpdate = (
  { renderedElementsMap },
  { VDOMPointer, payload: { newElement } },
) => {
  renderedElementsMap[VDOMPointer].nodeValue = newElement.value;
};

/*
  Function to apply to the browser's DOM a props diff item
  Input:
  - {
    renderedElementsMap: a map with keys VDOMPointer and values elements rendered in the browser
  }
  - VDOMPointer: the pointer to the element which props we want to update
  - propsChanged: the list of prop diff item we want to apply
  Side effects:
  Updates the browser's DOM with the applied props
*/
const applyProps = (
  { renderedElementsMap },
  { VDOMPointer, payload: propsChanged },
) => {
  // Loop through all prop diff items
  Object.entries(propsChanged).forEach(
    // Extracting for each the propDiffType (updated or removed)
    // As well as the oldValue and the newValue for the given prop
    // Example of what each of those values could be:
    // [key = 'id', [propdDiffType = 'updated', { oldValue: 'main-title', newValue: 'sub-title' }]]
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

// A map of applicators to simplify application
const diffApplicators = {
  [diffType.nodeRemoved]: applyNodeRemoved,
  [diffType.nodeAdded]: applyNodeAdded,
  [diffType.nodeReplaced]: applyNodeReplaced,
  [diffType.primitiveNodeUpdate]: applyPrimitiveNodeUpdate,
  [diffType.props]: applyProps,
};

/*
  Function to apply the diff to the browser's DOM
  Input:
  - diff: the diff we want to apply to the DOM
  - renderedElementsMap: a map with keys VDOMPointer and values elements rendered in the browser
  - renderableVDOM: the renderableVDOM for the current update cycle
  Side effects:
  Updates the browser's DOM as well as the references in the renderedElementsMap.
*/
const applyDiff = (diff, renderedElementsMap, renderableVDOM) => {
  // Sort diff item so applying them is safe
  const sortedDiffs = diff.sort(
    (a, b) =>
      diffApplicationOrder.indexOf(a.type) -
      diffApplicationOrder.indexOf(b.type),
  );
  // Apply them all!
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
    // subscribes to DOM changes which are driven by state changes
    startRenderSubscription(rootChild, (renderableVDOM, diff) => {
      if (Object.keys(renderedElementsMap).length === 0) {
        const rootChildAsHTML = renderElementToHtml(
          renderableVDOM,
          renderedElementsMap,
        );
        rootElement.appendChild(rootChildAsHTML);
      } else {
        // Now on update instead of replacing the whole browser's DOM
        // we will try to only do targeted updates of it
        applyDiff(diff, renderedElementsMap, renderableVDOM);
      }
    });
  },
});

export const DOMHandlers = {
  createRoot,
};

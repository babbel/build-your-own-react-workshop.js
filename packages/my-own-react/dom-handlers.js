import { startRenderSubscription } from '.';
import {
  findRenderableByVDOMPointer,
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

const applyPropToHTMLElement = ({ key, value }, element) => {
  if (isEventHandlerProp(key)) {
    addEventHandler(element, { key, value });
    return;
  }
  element[key] = value;
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
  // DON'T FORGET AFTER YOU HANDLED PROPS UPDATE
  // Here we want to render the node from the payload to the DOM
  // To do so, you will need to:
  // 1. Create the right HTML element for that node
  // 2. Find the right place to insert the node (ps: the provided `findNextSiblingOfVDOMPointer` function might come in handy)
  // Careful, some primitive elements don't render anything to the DOM
  // and don't forget to update the renderedElementsMap after the real DOM is updated.
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
          // DON'T FORGET
          // How to handle event listeners?
          // What do we need to do when an event listener callback was updated?
        }
        // START HERE
        // How to update the attribute on the element
        // Here we are trying to update the attribute `key` of the element at VDOMPointer within the browser's DOM
        // from it's old value `oldValue` to its new value `newValue`
      }
    },
  );
};

// A map of applicators to simplify application
const diffApplicators = {
  [diffType.nodeRemoved]: () => {},
  [diffType.nodeAdded]: applyNodeAdded,
  [diffType.nodeReplaced]: () => {},
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

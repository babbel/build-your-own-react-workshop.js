import { startRenderSubscription } from '.';
import {
  findRenderableByVDOMPointer,
  isPrimitiveElement,
} from './vdom-helpers';
import { diffType, propsDiffType, diffApplicationOrder } from './diff';

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
  { props: { children, ...props }, type },
  renderedElementsMap,
) => {
  // should appear in chapter-1/step-2
  const domElement = document.createElement(type);
  // should appear in chapter-1/step-3
  Object.entries(props).forEach(([key, value]) => {
    applyPropToHTMLElement({ key, value }, domElement);
  });
  // should appear in chapter-1/step-6
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
  // should appear in chapter-1/step-2
  return domElement;
};

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
};

const renderElementToHtml = (element, renderedElementsMap) => {
  const renderedElement = isPrimitiveElement(element)
    ? renderPrimitiveToHtml(element)
    : renderComponentElementToHtml(element, renderedElementsMap);
  renderedElementsMap[element.VDOMPointer] = renderedElement;
  return renderedElement;
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
  // and don't forget to update the renderedElementsMap
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
          // DON'T FORGET
          // How to handle event listeners?
          // What do we need to do when an event listener callback was updated?
        }
        // START HERE
        // How to update the attribute on the element
      }
    },
  );
};

const diffApplicators = {
  [diffType.nodeRemoved]: () => {},
  [diffType.nodeAdded]: applyNodeAdded,
  [diffType.nodeReplaced]: () => {},
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
    // should appear in chapter-2/step-1
    // let lastChild;
    let renderedElementsMap = {};
    startRenderSubscription(rootChild, (renderableVDOM, diff) => {
      // startRenderSubscription(rootChild, (renderableVDOM) => {
      if (Object.keys(renderedElementsMap).length === 0) {
        const rootChildAsHTML = renderElementToHtml(
          renderableVDOM,
          renderedElementsMap,
        );
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
  },
});

export const DOMHandlers = {
  createRoot,
};

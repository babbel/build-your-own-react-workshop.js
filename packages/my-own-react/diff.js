import { isPrimitiveElement, getVDOMElement } from './vdom-helpers';

// This is a map with all the diff types we will support
export const diffType = {
  nodeAdded: 'nodeAdded',
  nodeRemoved: 'nodeRemoved',
  nodeReplaced: 'nodeReplaced',
  primitiveNodeUpdate: 'primitiveNodeUpdate',
  props: 'props',
};

// The props diff has two variations for updated and removed
export const propsDiffType = {
  updated: 'updated',
  removed: 'removed',
};

// The following are helper functions to create diff items
const createNodeAddedPayload = (
  currentRenderableVDOMElement,
  parentPointer,
) => ({
  VDOMPointer: currentRenderableVDOMElement.VDOMPointer,
  type: diffType.nodeAdded,
  payload: { node: currentRenderableVDOMElement, parentPointer },
});

const createNodeRemoved = (VDOMPointer) => ({
  VDOMPointer,
  type: diffType.nodeRemoved,
  payload: {},
});

const createNodeReplaced = (
  currentRenderableVDOMElement,
  oldNode,
  parentPointer,
) => ({
  VDOMPointer: currentRenderableVDOMElement.VDOMPointer,
  type: diffType.nodeReplaced,
  payload: {
    newNode: currentRenderableVDOMElement,
    oldNode,
    parentPointer,
  },
});

const createPrimitiveNodeUpdate = (
  currentRenderableVDOMElement,
  newElement,
) => ({
  VDOMPointer: currentRenderableVDOMElement.VDOMPointer,
  type: diffType.primitiveNodeUpdate,
  payload: { newElement },
});

const createPropsDiff = (
  currentRenderableVDOMElement,
  changedProps
) => ({
  VDOMPointer: currentRenderableVDOMElement.VDOMPointer,
  type: diffType.props,
  payload: changedProps,
});

const createPropsDiffTypeRemoved = (
  oldValue
) => ([
  propsDiffType.removed,
  { oldValue },
]);

const createPropsDiffTypeUpdated = (
  newValue,
  oldValue
) => ([
  propsDiffType.updated,
  { newValue, oldValue },
]);

// Diff will need to be applied in a specific order to work correctly
export const diffApplicationOrder = [
  diffType.nodeRemoved,
  diffType.nodeAdded,
  diffType.nodeReplaced,
  diffType.primitiveNodeUpdate,
  diffType.props,
];

/* 
  This function will calculate a diff for the renderable VDOM
  Input
  - currentRenderableVDOMElement the root element of the renderableVDOM (or the root element of a subtree for recursion)
  - vdom the VDOMWithHistory structure with the current and previous VDOM
  - parentPointer the VDOMPointer to the parent of the current element (convenience as in the renderableVDOM, parents might not be part of the structure in case they are components)
  Output
  - Diff between currentRenderableVDOMElement and the vdom.previous, an array of diff items created with the helper functions above
*/
export const getRenderableVDOMDiff = (
  currentRenderableVDOMElement,
  vdom,
  parentPointer,
) => {
  // Retrieve the previous element in the VDOM for comparison
  const prev = getVDOMElement(
    currentRenderableVDOMElement.VDOMPointer,
    vdom.previous,
  );

  // If there is no previous element at the position for which there is a current element
  if (!prev) {
    return [
      createNodeAddedPayload(currentRenderableVDOMElement, parentPointer)
    ];
  }

  // Access the actual elements to compare them
  const prevElement = prev.element;
  // renderableVDOM element don't have renderedChildren, so they are already the element
  const currElement = currentRenderableVDOMElement;

  if (prevElement.type !== currElement.type) {
    return [
      createNodeReplaced(
        currentRenderableVDOMElement,
        prevElement,
        parentPointer,
      ),
    ];
  }

  // Both same type, let's continue calculting diff 👇

  // If both primitive
  if (isPrimitiveElement(prevElement) && isPrimitiveElement(currElement)) {
    if (prevElement.value !== currElement.value) {
      return [
        createPrimitiveNodeUpdate(currentRenderableVDOMElement, currElement),
      ];
    }

    // no change
    return [];
  }

  // Prepare props diff item
  const changedProps = {};
  // Collect all props keys from the previous and current element
  const keys = Array.from(
    new Set([
      ...Object.keys(prevElement.props),
      ...Object.keys(currElement.props),
    ]),
  );
  // Loop through the props keys
  for (const key of keys) {
    // Children is a special prop as it requires us to go recursive so we ignore it here
    if (key === 'children') {
      continue;
    }
    const currentPropValue = currElement.props[key];
    const previousPropValue = prevElement.props[key];

    // If the current props have no reference to the prop we evaluate
    if (typeof currentPropValue === 'undefined') {
      changedProps[key] = createPropsDiffTypeRemoved(previousPropValue);
      continue;
    }

    // If the current and previous prop value aren't the same
    if (currentPropValue !== previousPropValue) {
      changedProps[key] = createPropsDiffTypeUpdated(currentPropValue, previousPropValue);
    }
  }

  let diff = [];
  // conditional case to keep output clean
  if (Object.keys(changedProps).length > 0) {
    diff.push(createPropsDiff(currentRenderableVDOMElement, changedProps));
  }

  // Recursive into children
  const prevChildren = prev.renderedChildren || [];
  const currChildren = currentRenderableVDOMElement.props.children || [];
  // We need to loop through all children to compute the diff correctly
  // so we pick the length of the element with the most children
  const maxLength = Math.max(prevChildren.length, currChildren.length);
  for (let index = 0; index < maxLength; index++) {
    const currChild = currChildren[index];
    if (!currChild) {
      diff.push(createNodeRemoved(prevChildren[index].element.VDOMPointer));
      continue;
    }
    const subTreeDiff = getRenderableVDOMDiff(
      currChild,
      vdom,
      currentRenderableVDOMElement.VDOMPointer,
    );
    diff = [...diff, ...subTreeDiff];
  }

  return diff;
};

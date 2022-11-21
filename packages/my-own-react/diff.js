import { isPrimitiveElement, getVDOMElement } from './vdom-helpers';

export const diffType = {
  nodeAdded: 'nodeAdded',
  nodeRemoved: 'nodeRemoved',
  nodeReplaced: 'nodeReplaced',
  primitiveNodeUpdate: 'primitiveNodeUpdate',
  props: 'props',
};

export const propsDiffType = {
  updated: 'updated',
  removed: 'removed',
};

// Should appear in chapter-4/step-1
export const diffApplicationOrder = [
  diffType.nodeRemoved,
  diffType.nodeAdded,
  diffType.nodeReplaced,
  diffType.primitiveNodeUpdate,
  diffType.props,
];

// Should appear in chapter-3/step-2
export const getRenderableVDOMDiff = (
  currentRenderableVDOMElement,
  vdom,
  parentPointer,
) => {
  const prev = getVDOMElement(
    currentRenderableVDOMElement.VDOMPointer,
    vdom.previous,
  );

  // no change
  if (!prev && !currentRenderableVDOMElement) {
    return [];
  }

  // added element
  if (!prev) {
    return [
      {
        VDOMPointer: currentRenderableVDOMElement.VDOMPointer,
        type: diffType.nodeAdded,
        payload: { node: currentRenderableVDOMElement, parentPointer },
      },
    ];
  }

  // Hopefully this becomes redundant
  // removed element
  if (!currentRenderableVDOMElement) {
    return [
      {
        VDOMPointer: currentRenderableVDOMElement.VDOMPointer,
        type: diffType.nodeRemoved,
        payload: {},
      },
    ];
  }

  const prevElement = prev.element;
  const currElement = currentRenderableVDOMElement;

  // Have different types
  if (
    typeof prevElement !== typeof currElement ||
    typeof (prevElement || {}).type !== typeof (currElement || {}).type
  ) {
    return [
      {
        VDOMPointer: currentRenderableVDOMElement.VDOMPointer,
        type: diffType.nodeReplaced,
        payload: {
          newNode: currentRenderableVDOMElement,
          oldNode: prevElement,
          parentPointer,
        },
      },
    ];
  }

  // Both same type 👇

  // If both primitive
  if (isPrimitiveElement(prevElement) && isPrimitiveElement(currElement)) {
    if (prevElement.value !== currElement.value) {
      return [
        {
          VDOMPointer: currentRenderableVDOMElement.VDOMPointer,
          type: diffType.primitiveNodeUpdate,
          payload: { newElement: currElement },
        },
      ];
    }

    // no change
    return [];
  }

  const changedProps = {};
  // Compare props
  const keys = Array.from(
    new Set([
      ...Object.keys(prevElement.props),
      ...Object.keys(currElement.props),
    ]),
  );
  for (var index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (key === 'children') {
      continue;
    }

    // seperating this case just in case we may wanna delete the prop directly
    if (!(key in currElement.props)) {
      changedProps[key] = [
        propsDiffType.removed,
        { oldValue: prevElement.props[key] },
      ];
      continue;
    }

    if (currElement.props[key] !== prevElement.props[key]) {
      changedProps[key] = [
        propsDiffType.updated,
        { newValue: currElement.props[key], oldValue: prevElement.props[key] },
      ];
    }
  }

  let diff = [];
  // conditional case to keep output clean
  if (Object.keys(changedProps).length > 0) {
    diff.push({
      VDOMPointer: currentRenderableVDOMElement.VDOMPointer,
      type: diffType.props,
      payload: changedProps,
    });
  }

  // Recursive into children
  const prevChildren = prev.renderedChildren || [];
  const currChildren = currentRenderableVDOMElement.props.children || [];
  const maxIndex = Math.max(prevChildren.length, currChildren.length);
  for (let index = 0; index < maxIndex; index++) {
    const currChild = currChildren[index];
    if (!currChild) {
      diff.push({
        VDOMPointer: [...currentRenderableVDOMElement.VDOMPointer, index],
        type: diffType.nodeRemoved,
        payload: {},
      });
      continue;
    }
    const res = getRenderableVDOMDiff(
      currChild,
      vdom,
      currentRenderableVDOMElement.VDOMPointer,
    );
    if (res) {
      diff = [...diff, ...res];
    }
  }

  return diff;
};

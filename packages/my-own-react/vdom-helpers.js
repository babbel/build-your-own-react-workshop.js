const PRIMITIVE_TYPE = 'primitive';

// should appear in chapter-2/step-1
export const isPrimitiveElement = element => element.type === PRIMITIVE_TYPE;

// should appear in chapter-2/step-1
export const getVDOMElement = (pointer, VDOM) =>
  pointer.reduce(
    (targetElement, currentIndex) =>
      targetElement
        ? (targetElement.renderedChildren || [])[currentIndex]
        : targetElement,
    VDOM,
  );

// should appear in chapter-2/step-1
export const setCurrentVDOMElement = (pointer, element, VDOM) => {
  if (pointer.length === 0) {
    VDOM.current = element;
    return;
  }
  const pointerToParent = getVDOMElement(pointer.slice(0, -1), VDOM.current);
  const currentChildIndex = pointer[pointer.length - 1];
  pointerToParent.renderedChildren[currentChildIndex] = element;
};

// should appear in chapter-2/step-1
export const createVDOMElement = (element, renderedChildren = []) => ({
  element,
  renderedChildren,
});

export const createRenderableVDOMElement = (props, type, VDOMPointer) => ({
  props,
  type,
  VDOMPointer,
});

export const createPrimitiveVDOMElement = (value, VDOMPointer) => ({
  type: PRIMITIVE_TYPE,
  value,
  VDOMPointer,
});

export const findRenderableByVDOMPointer = (renderableVDOM, domPointer) => {
  if (!renderableVDOM) {
    return;
  }
  if (renderableVDOM.VDOMPointer === domPointer) {
    return renderableVDOM;
  }
  if (renderableVDOM.type === 'primitive' || !renderableVDOM.props.children) {
    return;
  }
  return renderableVDOM.props.children.reduce(
    (foundElement, child) =>
      foundElement
        ? foundElement
        : findRenderableByVDOMPointer(child, domPointer),
    null,
  );
};

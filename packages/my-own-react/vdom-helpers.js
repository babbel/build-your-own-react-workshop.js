const PRIMITIVE_TYPE = 'primitive';

export const isPrimitiveElement = element => element.type === PRIMITIVE_TYPE;


// Function to retrieve the element associated to the pointer in the provided VDOM 
export const getVDOMElement = (pointer, VDOM) =>
  pointer.reduce(
    (targetElement, currentIndex) =>
      targetElement
        ? (targetElement.renderedChildren || [])[currentIndex]
        : targetElement,
    VDOM,
  );

// Function to set the provided element at the position of the pointer in the provided VDOM 
export const setCurrentVDOMElement = (pointer, element, VDOM) => {
  if (pointer.length === 0) {
    VDOM.current = element;
    return;
  }
  const pointerToParent = getVDOMElement(pointer.slice(0, -1), VDOM.current);
  const currentChildIndex = pointer[pointer.length - 1];
  pointerToParent.renderedChildren[currentChildIndex] = element;
};

// Helper function to create the VDOMElement structure for a given element
export const createVDOMElement = (element, VDOMPointer) => {
  let elementAsVDOMElement;
  if (typeof element !== 'object') {
    elementAsVDOMElement = {
      type: PRIMITIVE_TYPE,
      value: element,
      VDOMPointer,
    };
  } else {
    elementAsVDOMElement = {
      type: element.type,
      props: element.props,
      VDOMPointer
    };
  }
  return {
    element: elementAsVDOMElement,
    renderedChildren: [],
  };
}

// Helper function to transform a string pointer into an array VDOMPointer
export const vdomPointerKeyToVDOMPointerArray = pointerAsString => {
  // The empty array ends up with an empty string, so this needs extra care when transforming
  if (pointerAsString === '') {
    return [];
  }
  // All the others end up split by `,` so we can split them back and transform the string to a number
  return pointerAsString.split(',').map(s => parseInt(s));
};

// Helper function to find a given renderable element in the renderableVDOM
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

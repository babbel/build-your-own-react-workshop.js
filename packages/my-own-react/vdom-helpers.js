const PRIMITIVE_TYPE = 'primitive';

// should appear in chapter-2/step-1
export const isPrimitiveElement = (element) => element.type === PRIMITIVE_TYPE;

// should appear in chapter-2/step-1
export const getVDOMElement = (pointer, VDOM) => pointer.reduce(
    (targetElement, currentIndex) => targetElement ? (targetElement.renderedChildren || [])[currentIndex] : targetElement,
    VDOM
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
    VDOMPointer
});

// diff should appear in chapter-3/step-2
export const vdomPointerKeyToVDOMPointerArray = (pointerAsString) => {
    // The empty array ends up with an empty string, so this needs extra care when transforming
    if (pointerAsString === '') {
      return [];
    }
    // All the others end up split by `,` so we can split them back and transform the string to a number
    return pointerAsString.split(',').map(s => parseInt(s));
  };


// should appear in chapter-4/step-1
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
    return renderableVDOM.props.children.reduce((foundElement, child) =>
      foundElement ? foundElement : findRenderableByVDOMPointer(child, domPointer),
      null
    );
  }
  
// should appear in chapter-4/step-1
export const isChildVDOMPointer = (childVDOMPointer, parentVDOMPointer) => {
    // everything is a child of the root level pointer []
    if (parentVDOMPointer.length === 0) {
        return true;
    }
    // to find out if a specific pointer is a child of another pointer, we can
    // verify whether it contains numbers within the parent pointer
    return new RegExp(`${parentVDOMPointer},(\\d+,?)+`).test(childVDOMPointer);
};

// should appear in chapter-4/step-1
export const findRootVDOMPointers = (pointers) => {
    if (pointers.length === 0) {
      return pointers;
    }
    let rootPointers = [pointers[0]];
    for (const pointer of pointers.slice(1)) {
      const rootPointersOfCurrent = rootPointers.filter(rootPointer => isChildVDOMPointer(pointer, rootPointer));
      if (rootPointersOfCurrent.length === 0) {
        const newRootPointers = rootPointers.filter(rootPointer => !isChildVDOMPointer(rootPointer, pointer));
        rootPointers = [...newRootPointers, pointer];
      }
    }
    return rootPointers;
  }
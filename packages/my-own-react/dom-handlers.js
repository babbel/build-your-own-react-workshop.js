// expects a JSX element => returns an HTML element
const renderTagElementToHtml = ({ props, type }) => {
  const domElement = document.createElement(type);
  // START HERE
  // How we can apply the props we receive to our DOM element?
  return domElement;
};

const createRoot = rootElement => ({
  rootElement,
  render: rootChild => {
    const rootChildAsHTML = renderTagElementToHtml(rootChild);
    rootElement.appendChild(rootChildAsHTML);
  },
});

export const DOMHandlers = {
  createRoot,
};

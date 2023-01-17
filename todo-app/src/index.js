import React from 'react';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { DOMHandlers } from 'my-own-react';

const rootElement = document.getElementById('root');

let fallbackEl = document.createElement('article');
fallbackEl.append(
  'Your render function is not returning anything yet. Check out my-own-react/dom-handlers.js to get started!',
);
fallbackEl.setAttribute('class', 'fallback');

const root = DOMHandlers.createRoot(rootElement);
// DON'T FORGET
// You can replace the div here by another tag, for example a span, to make sure your code is fully working!
root.render(<div />);

// render fallback
if (!rootElement.hasChildNodes()) rootElement.append(fallbackEl);

/*
const SimpleTest = () => (
  <div className="test" aria-hidden>
    <span>Hello World!</span>
  </div>
);

const Test = ({ message }) => (
  <div className="test" aria-hidden>
    <span>{message}</span>
  </div>
);

const MegaTest = () => (
  <div>
    <Test message="Hello world!" />
    <Test message="Super fun!" />
  </div>
);


const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<App />);

const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<MegaTest />);

const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<Test message="Hello World 2!" />);

const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<SimpleTest />);

const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div className="test">
  <span>Hello Test!</span>
</div>);

const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div className="test">
  Hello Test!
</div>);

  const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div className="test" id="test" aria-hidden></div>);

  const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div></div>);
*/

// const root = DOMHandlers.createRoot(document.getElementById('root'));
// root.render(<div></div>);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

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
fallbackEl.setAttribute('classname', 'fallback');

const SimpleTest = () => (
  <div className="test" aria-hidden>
    <span>Hello World!</span>
  </div>
);

const SimpleTestWithProps = ({ message }) => (
  <div className="test" aria-hidden>
    <span>{message}</span>
  </div>
);

const MegaTest = () => (
  <div>
    <SimpleTestWithProps message="Hello world!" />
    <SimpleTestWithProps message="Super fun!" />
  </div>
);

const root = DOMHandlers.createRoot(document.getElementById('root'));
// Once SimpleTest works, you can try to render SimpleTestWithProps, and then MegaTest
root.render(<SimpleTest />);

// render fallback
if (!rootElement.hasChildNodes()) rootElement.append(fallbackEl);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

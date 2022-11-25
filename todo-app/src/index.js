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

const root = DOMHandlers.createRoot(document.getElementById('root'));
// Now let's try to handle attributes here, you can try to handle simple ones first such as id
// and get to `className` closer to the end
root.render(<div className="test" id="test" aria-hidden></div>);

// const root = DOMHandlers.createRoot(rootElement);
// root.render(<App />);

// render fallback
if (!rootElement.hasChildNodes()) rootElement.append(fallbackEl);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

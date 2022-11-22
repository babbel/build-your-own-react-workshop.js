import React from 'react';
// import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { DOMHandlers } from 'my-own-react';

/*
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
*/

const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div className="test" id="test" aria-hidden></div>);

/*
  const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div></div>);
*/

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

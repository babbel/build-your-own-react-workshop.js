import React from 'react';
import ReactDOM from 'react-dom/client';
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
root.render(<App />);

/*
const SimpleTest = () => (
  <div className="test" aria-hidden style={{ backgroundColor: 'red', height: '100px', color: 'white' }}>
    <span>Hello World!</span>
  </div>
);

const Test = ({ message }) => (
  <div className="test" aria-hidden style={{ backgroundColor: 'red', height: '100px', color: 'white' }}>
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
root.render(<div className="test" aria-hidden style={{ backgroundColor: 'red', height: '100px', color: 'white' }}>
  <span>Hello Test!</span>
</div>);

const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div className="test" aria-hidden style={{ backgroundColor: 'red', height: '100px', color: 'white' }}>
  Hello Test!
</div>);

  const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div className="test" aria-hidden style={{ backgroundColor: 're', height: '100px', color: 'white' }}></div>);


  const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div className="test" aria-hidden style={{ backgroundColor: 'red', height: '100px', color: 'white' }}></div>);

  const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div className="test" aria-hidden></div>);

  const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div id="test"></div>);

  const root = DOMHandlers.createRoot(document.getElementById('root'));
root.render(<div></div>);
*/


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import {Fragment, jsxDEV } from '../../node_modules/react/jsx-dev-runtime';
import { tapFn } from './fn-utils';

// const jsxDEV = tapFn('jsxDEV', reactJsxDev);

/*
const jsxDEV = (...args) => {
  args.forEach(arg => {
    if (typeof arg === 'object') {
      try {
        console.log(JSON.stringify(arg, null, 2));
      } catch {

      }
    } else {
      console.log(arg);
    }
  })
  return reactJsxDev(...args);
}*/

export { Fragment, jsxDEV };

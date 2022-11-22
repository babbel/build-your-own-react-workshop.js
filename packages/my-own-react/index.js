import * as React from '../../node_modules/react';
export { DOMHandlers } from './dom-handlers';
export default React;

export const useState = (initialState) => [typeof initialState === 'function' ? initialState() : initialState, () => {}];
export const useEffect = () => {};

export const { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } = React;

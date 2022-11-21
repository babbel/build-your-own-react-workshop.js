# build-your-own-react-workshop.js
Library that constitutes part of a workshop for React Day 2022, which teaches participants how to build their own version of React (R2D2)

## Build your own (simple) React from scratch!

Have you ever wondered how React works?
What would it feel like to create the magical lines that make up the tool we all grew to learn and love?

Come along in our journey to implement React from scratch, making a simple React project work with your own `my-react.js` library.

At the end of the workshop, a simple TODO app written in React will work with your very own `my-react.js`.

Level: Medium
Duration of workshop: 3 hours

### Table of contents
- Introduction
- Rendering our first component
- Update cycle and the VDOM
- Meet the hooks


### Workshop Guide

#### Introduction
1. Clone the repo `gh repo clone babbel/build-your-own-react-workshop.js`
2. `cd ./todo-app && npm install`
3. Check out the working app using the real boring React `npm run start`

Each step of this workshop is represented by a git branch, which contains the relevant code and prompts for that step. Make sure to checkout the relevant branch whenever you move onto the next step.

`main` branch = starting point => TODO app connected to the real React

#### Chapter 1

*Rendering JSX*
By the end of this chapter your version of React: will have DOMHandlers that are able to render static JSX.

Chapter 1 Step 1 => DOMHandlers can render an empty div
`git checkout chapter-1/step-1`

Chapter 1 Step 2 => DOMHandlers can handle simple attributes
e.g. `id="step2`
`git checkout chapter-1/step-2`

Chapter 1 Step 3 => DOMHandlers can handle the `className` attribute
`git checkout chapter-1/step-3`

Chapter 1 Step 4 => DOMHandlers can handle HTML tag children
`git checkout chapter-1/step-4`

Chapter 1 Step 5 => DOMHandlers can handle components
`git checkout chapter-1/step-5`


#### Chapter 2
By the end of this chapter your version of React: will have a working `useState` and repaint the whole page on every update.

Chapter 2 Step 1 => How does state work? We need to subscribe!
`git checkout chapter-2/step-§`

Chapter 2 Step 2 => State on a component basis.
`git checkout chapter-2/step-2`

Chapter 2 Step 3 => How do we allow for multiple states per component?
`git checkout chapter-2/step-3`

#### Chapter 3
By the end of this chapter your version of React: will have Diffing and targeted DOM updates working correctly.

Chapter 3 Step 1 => How do we only update what's needed from the DOM
`git checkout chapter-3/step-1`

Chapter 3 Step 2 => Let's handle node added and prop changes
`git checkout chapter-3/step-2`

Chapter 3 Step 3 => Let's replace and delete nodes
`git checkout chapter-3/step-3`

#### Chapter 4
By the end of this chapter your version of React: will have the `useEffect` hook working correctly.

Chapter 4 Step 1 => Create useEffect without clean-ups
`git checkout chapter-4/step-1`

Chapter 4 Step 1 => Let's add clean-ups
`git checkout chapter-4/step-2`

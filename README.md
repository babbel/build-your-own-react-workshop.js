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

`main` branch = the beginning of the journey => TODO app connected to the real React

Each branch contains comments to help you along the way. Search for the following in the code for a hint:
`START HERE` => Starting point for the branch (step).
`DON'T FORGET` => Hint that some code needs to be added or edited for the step to be completed.

#### Chapter 1

_Rendering JSX_
By the end of this chapter your version of React: will have DOMHandlers that are able to render static JSX.

_Chapter 1 Step 1_ => DOMHandlers can render an empty div
`git checkout chapter-1/step-1`

_Chapter 1 Step 2_ => DOMHandlers can handle simple attributes
e.g. `id="step2`
`git checkout chapter-1/step-2`

_Chapter 1 Step 3_ => DOMHandlers can handle HTML tag children
`git checkout chapter-1/step-3`

_Chapter 1 Step 4_ => DOMHandlers can handle components
`git checkout chapter-1/step-4`

#### Chapter 2

By the end of this chapter your version of React: will have a working `useState` and repaint the whole page on every update.

_Chapter 2 Step 1_ => How does state work? We need to subscribe!
`git checkout chapter-2/step-§`

_Chapter 2 Step 2_ => State on a component basis.
`git checkout chapter-2/step-2`

_Chapter 2 Step 3_ => How do we allow for multiple states per component?
`git checkout chapter-2/step-3`

#### Chapter 3

By the end of this chapter your version of React: will have Diffing and targeted DOM updates working correctly.

_Chapter 3 Step 1_ => Let's handle node added and prop changes
`git checkout chapter-3/step-1`

_Chapter 3 Step 2_ => Let's replace and delete nodes
`git checkout chapter-3/step-2`

#### Chapter 4

By the end of this chapter your version of React: will have the `useEffect` hook working correctly.

```
  useEffect(() => {
    console.log('I update when titleIndex is changed');
    console.log('Closed around titleIndex', titleIndex);
    return () => console.log('titleIndex effect clean up');
  }, [titleIndex]);
```

_Chapter 4 Step 1_ => Create useEffect without clean-ups
`git checkout chapter-4/step-1`

In order for the `useEffect` hook to function, we need to create a callback that is a combination of callbacks (all of the app's useEffects). This callback of callbacks then needs to be triggered later in time e.g on re-renders or when the dependencies of the `useEffect` change.

_Chapter 4 Step 2_ => Let's add clean-ups
`git checkout chapter-4/step-2`

The useEffect cleanup is a function in the useEffect Hook that allows us to tidy up our code before our component unmounts. On every render the cleanup function is also triggered if the dependencies.

Therefore in this step, we need to ensure the cleanup function is called when the specific useEffect's dependencies change.

It is important that the clean up is triggered before the next effect is called.

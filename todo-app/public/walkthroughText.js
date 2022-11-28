var walkthroughText = {
  main: 'This app is currently using the real React. Checkout the branch chapter-1/step-1 to begin the journey to creating your own.',
  'chapter-1/step-1':
    'Chapter 1, Step 1:\n\nYour React cannot render anything yet. Check out the render function in dom-handlers.js. This is where the rendering of elements to the DOM happens. If you want to see/adapt what we are trying to render, you can go to todo-app/src/index.js and update the JSX in `root.render()`',
  'chapter-1/step-2':
    'Chapter 1, Step 2:\n\nYou can render an empty tag 🎉👏. But html elements need attributes like "id" to become more useful. How can we add these? Head to dom-handlers.js to implement it!',
  'chapter-1/step-3':
    'Chapter 1, Step 3:\n\nAttributes added 🍾. Now let us focus on adding children and getting some content on the page! Again you can head to dom-handlers.js',
  'chapter-1/step-4':
    'Chapter 1, Step 4:\n\nYour React can handle children 👩‍👧 but React is all about rendering components. What is a component? What do we need to consider to render one? You will want to go to the my-own-react/index.js for implementation',
  'chapter-2/step-1':
    'Chapter 2, Step 1:\n\nYour React can render components! 🎉🍾 But for our app to be dynamic we need our components to be stateful. Checkout hooks.js and think about how we can complete the useState hook. The To-Do list should work at the end of this step.',
  'chapter-2/step-2':
    'Chapter 2, Step 2:\n\nWe have one state per component!🦾 But what if we want our components to have more than one state? We have a problem currently. Look what happens with the counter 🫤',
  'chapter-3/step-1':
    'Chapter 3, Step 1:\n\nState completed. ⚙️ Now we need to look at the VDOM and handle diffing. Head to diff.js for more!',
  'chapter-3/step-2':
    "Chapter 3, Step 2:\n\nWe are now creating the right diff! But we need to still implement the logic to apply our diff. Let's start with applying props changed and then work on the case when a node needs to be added.",
  'chapter-4/step-1':
    'Chapter 4, Step 1:\n\nDiffing accomplished. ⁺− Now onto hooks and useEffect so our app can handle side-effects, such as saving our items to local storage so they persist on a page refresh!',
  'chapter-4/step-2':
    'Chapter 4, Step 2:\n\nHooks added. But we have a problem in that we are not cleaning up after our hooks render or unmount. This can lead to unwanted side-effects.',
  final: 'You made it! Bye bye React 👋, hello your own version.',
};

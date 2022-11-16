import { useEffect, useState } from 'react';
import { useLocalStorage } from './hooks/useStorageValue';
import AddItem from './components/AddItem';
import ToDos from './components/ToDos';
import './App.css';

const possibleTitles = ["Your ToDo's", "Super ToDo's", "To do - ba di ba di ba doo"];

function StaticStateComponent({ text }) {
  const [state] = useState(text);

  return <div>{state}</div>;
}

function StaticStateComponent2({ text }) {
  const [state] = useState(text);

  return <div>{state}</div>;
}

function Counter() {
  const [count, setCount] = useState(0);

  return <div>
    <span>The count is {count}</span>
    <button onClick={() => setCount(countState => countState + 1)}>+</button>
  </div>
}

function ComponentWithEffect({ titleIndex }) {
  useEffect(() => {
    console.log('I update when titleIndex is changed');
    console.log('Closed around titleIndex', titleIndex);
    return () => console.log('titleIndex effect clean up');
  }, [titleIndex]);
  return titleIndex;
}

function App() {
  const [items, setItems] = useLocalStorage('todoItems', []);
  const [titleIndex, setTitleIndex] = useState(0);

  const deleteItem = (item) => {
    setItems(existingItems => existingItems.filter(existingItem => existingItem !== item))
  }

  const addItem = (item) => {
    setItems(items => [item, ...items])
  }



  return (
    <div className="App">
      <header className="App-header">
        <a
          className="App-link"
          href="https://babbel.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          {possibleTitles[titleIndex]}
        </a>
      </header>
      <div className="content">
        {(titleIndex % 2 === 0) && <StaticStateComponent text="StaticStateComponent" />}
        <StaticStateComponent text="StaticStateComponent2" />
        {titleIndex % 3 !== 0 && <Counter />}
        {titleIndex % 3 !== 0 && <ComponentWithEffect titleIndex={titleIndex} />}
        <button onClick={() => setTitleIndex(current => (current + 1) % possibleTitles.length )}>Next title</button>
        <AddItem onAddItem={addItem} />
        <ToDos items={items} deleteItem={deleteItem} />
      </div>
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { useLocalStorage } from './hooks/useStorageValue';
import AddItem from './components/AddItem';
import ToDos from './components/ToDos';
import './App.css';


function SectionComponent({ children }) {
  return <section className="even-section">{children}</section>;
}

function ComponentWithEffect({ numberOfTodos }) {
  useEffect(() => {
    console.log('I update when the number of Todos changes');
    console.log('The current number of todos is', numberOfTodos);
    return () => console.log('Number of todos effect clean up');
  }, [numberOfTodos]);
  return false;
}

function App() {
  const [counter, setCounter] = useState(0);
  const [items, setItems] = useLocalStorage('todoItems', []);

  const deleteItem = item => {
    setItems(existingItems =>
      existingItems.filter(existingItem => existingItem !== item),
    );
  };

  const addItem = item => {
    setItems(items => [item, ...items]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <a
          className="App-link"
          href="https://babbel.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Your ToDo's
        </a>
      </header>
      <div className="content">
        <div className="counter">
          Counter: {`${counter}`}
          <button onClick={() => setCounter(count => count + 1)}>+</button>
        </div>
        <ComponentWithEffect numberOfTodos={items.length} />
        <AddItem onAddItem={addItem} />
        <ToDos items={items} deleteItem={deleteItem} />
        {items.length % 2 === 0 && (
          <SectionComponent>
            You have an even number of TODOs, me likey!
          </SectionComponent>
        )}
      </div>
    </div>
  );
}

export default App;

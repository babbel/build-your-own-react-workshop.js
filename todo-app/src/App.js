import { useState } from 'react'
import AddItem from './components/AddItem';
import ToDos from './components/ToDos';
import './App.css';

const possibleTitles = ["Your ToDo's", "Super ToDo's", "To do - ba di ba di ba doo"];

function App() {
  const [items, setItems] = useState(["Hello world!", "Super cool!"]);
  const [titleIndex, setTitleIndex] = useState(0);

  const deleteItem = (item) => {
    setItems(existingItems => existingItems.filter(existingItem => existingItem !== item))
  }

  const addItem = (item) => {
    setItems(items => [item, ...items])
  }

  console.log({items})
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
        <button onClick={() => setTitleIndex(current => (current + 1) % possibleTitles.length )}>Next title</button>
        <AddItem onAddItem={addItem} />
        <ToDos items={items} deleteItem={deleteItem} />
      </div>
    </div>
  );
}

export default App;

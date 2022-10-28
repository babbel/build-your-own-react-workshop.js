import { useState } from 'react'
import AddItem from './components/AddItem';
import ToDos from './components/ToDos';
import './App.css';

function App() {
  const [items, setItems] = useState(["Hello world!", "Super cool!"]);

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
          Your ToDo's
        </a>
      </header>
      <div className="content">
        <AddItem onAddItem={addItem} />
        <ToDos items={items} deleteItem={deleteItem} />
      </div>
    </div>
  );
}

export default App;

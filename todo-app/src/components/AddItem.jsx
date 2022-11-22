import { useState } from 'react';
import './AddItem.css';

const AddItem = ({ onAddItem }) => {
  const [item, setItem] = useState('');

  const handleInputChange = event => {
    setItem(event.target.value);
  };

  const handleOnAdd = event => {
    event.preventDefault();
    onAddItem(item);
    setItem('');
  };
  return (
    <form className="addSection" onSubmit={handleOnAdd}>
      <label className="inputLabel" htmlFor="itemInput">
        Add an item to your list
      </label>
      <input
        className="itemInput"
        onChange={handleInputChange}
        value={item}
        name="itemInput"
        placeholder="Add something you need to do"
      />
      <button className="addButton" type="submit" disabled={!item}>
        Add!
      </button>
    </form>
  );
};

export default AddItem;

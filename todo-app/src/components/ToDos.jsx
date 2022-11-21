import './ToDos.css';

const ToDoItem = ({ item, onDelete }) => (
  <li className="listItem">
    <p>{item}</p>
    <button onClick={() => onDelete(item)}>Delete</button>
  </li>
);

const ToDos = ({ items, deleteItem }) => (
  <ul className="list">
    {items?.map((item, index) => (
      <ToDoItem key={index + item} item={item} onDelete={deleteItem} />
    ))}
  </ul>
);

export default ToDos;

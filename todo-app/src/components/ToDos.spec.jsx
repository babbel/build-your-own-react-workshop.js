import { render, screen} from '@testing-library/react'
import { within } from '@testing-library/react';
import '@testing-library/jest-dom'
import ToDos from './ToDos';

test('ToDos renders list items provided', async () => {
  const mockItems = ['create', 'your', 'own'];
  render(<ToDos items={mockItems} />)


  const list = screen.getByRole('list');
  expect(list).toBeInTheDocument();
  const listItems = screen.getAllByRole('listitem');

  mockItems.forEach((item, index) => {
    const listItem = listItems[index];
    expect(listItem.textContent).toContain(item);
    expect(within(listItem).getByRole('button').textContent).toContain('Delete');
  })
})
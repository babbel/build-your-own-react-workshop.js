import { render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import AddItem from './AddItem';
import userEvent from '@testing-library/user-event'

const MOCK_ITEM = 'Make my own React';

const simulateAddingItem = async () => {
  const user = userEvent.setup();
  const input = screen.getByRole('textbox');
  await userEvent.type(input, MOCK_ITEM);

  const addButton = screen.getByRole('button');
  await user.click(addButton);
}

test('AddItem - onAddItem correctly called after user fills in input and submits', async () => {
  const mockOnAddItem = jest.fn();

  render(<AddItem onAddItem={mockOnAddItem} />)
  await simulateAddingItem()

  expect(mockOnAddItem).toHaveBeenCalledWith(MOCK_ITEM);
})

test('AddItem - text input correctly resets after adding item', async () => {
  const mockOnAddItem = jest.fn();
  const mockItem = 'Make my own React';
  render(<AddItem onAddItem={mockOnAddItem} />)
  await simulateAddingItem()
  const input = screen.getByRole('textbox');

  expect(input).toHaveValue('');
})
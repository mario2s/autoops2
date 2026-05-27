/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteButton from '@/components/DeleteButton';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

describe('DeleteButton', () => {
  test('does not call action on first click', async () => {
    const mockAction = jest.fn().mockResolvedValue({});
    const user = userEvent.setup();

    render(<DeleteButton action={mockAction} label="order" />);
    const deleteButton = screen.getByRole('button');

    // First click should open confirm
    await user.click(deleteButton);

    // Action should not be called yet
    expect(mockAction).not.toHaveBeenCalled();

    // Confirm text should appear
    expect(screen.getByText('Delete?')).toBeInTheDocument();
  });

  test('calls action on confirm click', async () => {
    const mockAction = jest.fn().mockResolvedValue({});
    const user = userEvent.setup();

    render(<DeleteButton action={mockAction} label="order" />);
    const deleteButton = screen.getByRole('button');

    // First click to open confirm
    await user.click(deleteButton);

    // Second click on "Yes" button
    const yesButton = screen.getByText('Yes');
    await user.click(yesButton);

    // Action should be called now
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  test('shows error message if action fails', async () => {
    const mockAction = jest.fn().mockResolvedValue({ error: 'Cannot delete' });
    const user = userEvent.setup();

    render(<DeleteButton action={mockAction} label="order" />);
    const deleteButton = screen.getByRole('button');

    // Click to confirm
    await user.click(deleteButton);
    const yesButton = screen.getByText('Yes');
    await user.click(yesButton);

    // Error message should appear
    expect(screen.getByText('Cannot delete')).toBeInTheDocument();
  });

  test('can cancel delete action', async () => {
    const mockAction = jest.fn().mockResolvedValue({});
    const user = userEvent.setup();

    render(<DeleteButton action={mockAction} label="order" />);
    const deleteButton = screen.getByRole('button');

    // Click to open confirm
    await user.click(deleteButton);
    expect(screen.getByText('Delete?')).toBeInTheDocument();

    // Click "No"
    const noButton = screen.getByText('No');
    await user.click(noButton);

    // Confirm should be gone
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument();
    expect(mockAction).not.toHaveBeenCalled();
  });
});

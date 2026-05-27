/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MechanicBadge from '@/components/orders/MechanicBadge';

// Mock the action
jest.mock('@/actions/orders', () => ({
  updateOrderMechanicAction: jest.fn().mockResolvedValue({}),
}));

describe('MechanicBadge', () => {
  const mechanics = [
    { id: 'm1', name: 'John Doe' },
    { id: 'm2', name: 'Jane Smith' },
    { id: 'm3', name: 'Bob Wilson' },
  ];

  test('renders the mechanic name', () => {
    render(
      <MechanicBadge orderId="1" mechanicId="m1" mechanicName="John Doe" mechanics={mechanics} />
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('displays all available mechanics in dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(
      <MechanicBadge orderId="1" mechanicId="m1" mechanicName="John Doe" mechanics={mechanics} />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // All mechanics should be visible in the dropdown
    const allJohnDoes = screen.getAllByText('John Doe');
    expect(allJohnDoes.length).toBeGreaterThan(1); // In button and dropdown
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  test('has correct CSS classes for badge styling', () => {
    const { container } = render(
      <MechanicBadge orderId="1" mechanicId="m1" mechanicName="John Doe" mechanics={mechanics} />
    );
    const badge = container.querySelector('button');
    expect(badge).toHaveClass('bg-zinc-100');
    expect(badge).toHaveClass('text-zinc-600');
  });
});

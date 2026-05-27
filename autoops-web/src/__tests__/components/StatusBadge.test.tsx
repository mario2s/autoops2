/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import StatusBadge from '@/components/orders/StatusBadge';

// Mock the action
jest.mock('@/actions/orders', () => ({
  updateOrderStatusAction: jest.fn().mockResolvedValue({}),
}));

describe('StatusBadge', () => {
  test('renders the correct label for booked status', () => {
    render(<StatusBadge orderId="1" status="booked" />);
    expect(screen.getByText('Booked')).toBeInTheDocument();
  });

  test('renders the correct label for in_progress status', () => {
    render(<StatusBadge orderId="1" status="in_progress" />);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  test('renders the correct label for awaiting status', () => {
    render(<StatusBadge orderId="1" status="awaiting" />);
    expect(screen.getByText('Awaiting')).toBeInTheDocument();
  });

  test('renders the correct label for payment status', () => {
    render(<StatusBadge orderId="1" status="payment" />);
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });

  test('renders the correct label for done status', () => {
    render(<StatusBadge orderId="1" status="done" />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  test('applies correct CSS classes for booked status', () => {
    const { container } = render(<StatusBadge orderId="1" status="booked" />);
    const badge = container.querySelector('button');
    expect(badge).toHaveClass('bg-blue-500/10');
    expect(badge).toHaveClass('text-blue-600');
  });

  test('applies correct CSS classes for in_progress status', () => {
    const { container } = render(<StatusBadge orderId="1" status="in_progress" />);
    const badge = container.querySelector('button');
    expect(badge).toHaveClass('bg-emerald-500/10');
    expect(badge).toHaveClass('text-emerald-600');
  });

  test('applies correct CSS classes for done status', () => {
    const { container } = render(<StatusBadge orderId="1" status="done" />);
    const badge = container.querySelector('button');
    expect(badge).toHaveClass('bg-zinc-100');
    expect(badge).toHaveClass('text-zinc-500');
  });
});

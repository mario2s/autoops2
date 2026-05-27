import {
  formatCurrency,
  formatDate,
  isOverdue,
  vehicleLabel,
} from '@/lib/format';

describe('format', () => {
  describe('formatCurrency', () => {
    test('formats currency with 2 decimal places', () => {
      expect(formatCurrency(77)).toBe('$77.00');
      expect(formatCurrency(1.5)).toBe('$1.50');
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('isOverdue', () => {
    test('returns true for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isOverdue(pastDate.toISOString())).toBe(true);
    });

    test('returns false for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isOverdue(futureDate.toISOString())).toBe(false);
    });

    test('returns false for invalid date', () => {
      expect(isOverdue('garbage')).toBe(false);
    });
  });

  describe('vehicleLabel', () => {
    test('returns license plate when available', () => {
      const result = vehicleLabel({ licensePlate: 'CA1234', description: null });
      expect(result).toBe('CA1234');
    });

    test('returns description when license plate is null', () => {
      const result = vehicleLabel({ licensePlate: null, description: 'Red sedan' });
      expect(result).toBe('Red sedan');
    });

    test('returns make and model when both plate and description are null', () => {
      const result = vehicleLabel({ licensePlate: null, description: null, make: 'Toyota', model: 'Corolla' });
      expect(result).toBe('Toyota Corolla');
    });

    test('returns "Vehicle" when all fields are null', () => {
      const result = vehicleLabel({ licensePlate: null, description: null });
      expect(result).toBe('Vehicle');
    });
  });

  describe('formatDate', () => {
    test('returns raw input for invalid date', () => {
      expect(formatDate('garbage')).toBe('garbage');
    });
  });
});

import { computeOrderTotals } from '@/lib/order-totals';

describe('order-totals', () => {
  describe('computeOrderTotals', () => {
    test('calculates parts total correctly', () => {
      const result = computeOrderTotals([{ qty: 2, unitPrice: 38.5 }], []);
      expect(result.parts).toBe(77);
      expect(result.services).toBe(0);
      expect(result.grand).toBe(77);
    });

    test('calculates hourly service total correctly', () => {
      const result = computeOrderTotals([], [{ costType: 'hourly', hours: 1.5, rate: 45 }]);
      expect(result.parts).toBe(0);
      expect(result.services).toBe(67.5);
      expect(result.grand).toBe(67.5);
    });

    test('calculates fixed service total correctly', () => {
      const result = computeOrderTotals([], [{ costType: 'fixed', fixedAmount: 25 }]);
      expect(result.parts).toBe(0);
      expect(result.services).toBe(25);
      expect(result.grand).toBe(25);
    });

    test('combines parts and services correctly', () => {
      const result = computeOrderTotals(
        [{ qty: 2, unitPrice: 38.5 }],
        [
          { costType: 'hourly', hours: 1.5, rate: 45 },
          { costType: 'fixed', fixedAmount: 25 },
        ]
      );
      expect(result.parts).toBe(77);
      expect(result.services).toBe(92.5);
      expect(result.grand).toBe(169.5);
    });

    test('returns zeros for empty arrays', () => {
      const result = computeOrderTotals([], []);
      expect(result.parts).toBe(0);
      expect(result.services).toBe(0);
      expect(result.grand).toBe(0);
    });

    test('handles rounding correctly', () => {
      const result = computeOrderTotals([{ qty: 3, unitPrice: 3.337 }], []);
      expect(result.parts).toBe(10.01);
    });
  });
});

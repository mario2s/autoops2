jest.mock('@/db', () => ({ db: {} }));

import { round2, parsePartsArray, parseServicesArray, parseOrderInput } from '@/lib/api-orders';
import { ApiError } from '@/lib/api-error';

describe('api-orders', () => {
  describe('round2', () => {
    test('rounds to 2 decimal places', () => {
      expect(round2(77)).toBe(77);
      expect(round2(92.5)).toBe(92.5);
      expect(round2(10.126)).toBe(10.13);
      expect(round2(10.124)).toBe(10.12);
    });
  });

  describe('parsePartsArray', () => {
    test('valid part', () => {
      const result = parsePartsArray([{ catalogPartId: 'p1', qty: 2, unitPrice: 38.5 }]);
      expect(result).toEqual([{ catalogPartId: 'p1', qty: 2, unitPrice: 38.5 }]);
    });

    test('throws for non-array input', () => {
      expect(() => parsePartsArray('x')).toThrow();
      try {
        parsePartsArray('x');
      } catch (e) {
        expect((e as ApiError).status).toBe(400);
        expect((e as ApiError).code).toBe('INVALID_PART');
      }
    });

    test('throws for qty 0 or negative', () => {
      expect(() => parsePartsArray([{ catalogPartId: 'p1', qty: 0, unitPrice: 38.5 }])).toThrow();
      try {
        parsePartsArray([{ catalogPartId: 'p1', qty: 0, unitPrice: 38.5 }]);
      } catch (e) {
        expect((e as ApiError).code).toBe('INVALID_PART');
        expect((e as ApiError).message).toContain('qty must be > 0');
      }
    });

    test('throws for negative unitPrice', () => {
      expect(() => parsePartsArray([{ catalogPartId: 'p1', qty: 1, unitPrice: -1 }])).toThrow();
      try {
        parsePartsArray([{ catalogPartId: 'p1', qty: 1, unitPrice: -1 }]);
      } catch (e) {
        expect((e as ApiError).code).toBe('INVALID_PART');
      }
    });

    test('throws for missing catalogPartId', () => {
      expect(() => parsePartsArray([{ qty: 1, unitPrice: 38.5 }])).toThrow();
      try {
        parsePartsArray([{ qty: 1, unitPrice: 38.5 }]);
      } catch (e) {
        expect((e as ApiError).code).toBe('INVALID_PART');
      }
    });
  });

  describe('parseServicesArray', () => {
    test('valid hourly service', () => {
      const result = parseServicesArray([{ description: 'x', costType: 'hourly', hours: 1.5, rate: 45 }]);
      expect(result).toEqual([{ description: 'x', costType: 'hourly', hours: 1.5, rate: 45, fixedAmount: null }]);
    });

    test('valid fixed service', () => {
      const result = parseServicesArray([{ description: 'x', costType: 'fixed', fixedAmount: 25 }]);
      expect(result).toEqual([{ description: 'x', costType: 'fixed', hours: null, rate: null, fixedAmount: 25 }]);
    });

    test('throws for invalid costType', () => {
      expect(() => parseServicesArray([{ description: 'x', costType: 'weird', fixedAmount: 25 }])).toThrow();
      try {
        parseServicesArray([{ description: 'x', costType: 'weird', fixedAmount: 25 }]);
      } catch (e) {
        expect((e as ApiError).code).toBe('INVALID_SERVICE');
      }
    });

    test('throws for hourly with hours 0', () => {
      expect(() => parseServicesArray([{ description: 'x', costType: 'hourly', hours: 0, rate: 45 }])).toThrow();
      try {
        parseServicesArray([{ description: 'x', costType: 'hourly', hours: 0, rate: 45 }]);
      } catch (e) {
        expect((e as ApiError).code).toBe('INVALID_SERVICE');
      }
    });

    test('throws for fixed with negative fixedAmount', () => {
      expect(() => parseServicesArray([{ description: 'x', costType: 'fixed', fixedAmount: -1 }])).toThrow();
      try {
        parseServicesArray([{ description: 'x', costType: 'fixed', fixedAmount: -1 }]);
      } catch (e) {
        expect((e as ApiError).code).toBe('INVALID_SERVICE');
      }
    });

    test('throws for empty description', () => {
      expect(() => parseServicesArray([{ description: '', costType: 'fixed', fixedAmount: 25 }])).toThrow();
      try {
        parseServicesArray([{ description: '', costType: 'fixed', fixedAmount: 25 }]);
      } catch (e) {
        expect((e as ApiError).code).toBe('INVALID_SERVICE');
      }
    });
  });

  describe('parseOrderInput', () => {
    test('throws for missing vehicleId with requireAll', () => {
      expect(() => parseOrderInput({ clientId: 'c1', deadline: '2025-12-31' }, { requireAll: true })).toThrow();
      try {
        parseOrderInput({ clientId: 'c1', deadline: '2025-12-31' }, { requireAll: true });
      } catch (e) {
        expect((e as ApiError).code).toBe('MISSING_VEHICLE');
      }
    });

    test('throws for missing clientId with requireAll', () => {
      expect(() => parseOrderInput({ vehicleId: 'v1', deadline: '2025-12-31' }, { requireAll: true })).toThrow();
      try {
        parseOrderInput({ vehicleId: 'v1', deadline: '2025-12-31' }, { requireAll: true });
      } catch (e) {
        expect((e as ApiError).code).toBe('MISSING_CLIENT');
      }
    });

    test('throws for missing deadline with requireAll', () => {
      expect(() => parseOrderInput({ vehicleId: 'v1', clientId: 'c1' }, { requireAll: true })).toThrow();
      try {
        parseOrderInput({ vehicleId: 'v1', clientId: 'c1' }, { requireAll: true });
      } catch (e) {
        expect((e as ApiError).code).toBe('MISSING_DEADLINE');
      }
    });

    test('throws for invalid deadline string', () => {
      expect(() => parseOrderInput({ vehicleId: 'v1', clientId: 'c1', deadline: 'not-a-date' }, { requireAll: true })).toThrow();
      try {
        parseOrderInput({ vehicleId: 'v1', clientId: 'c1', deadline: 'not-a-date' }, { requireAll: true });
      } catch (e) {
        expect((e as ApiError).code).toBe('INVALID_DEADLINE');
      }
    });

    test('throws for empty line items with requireAll', () => {
      expect(() =>
        parseOrderInput({ vehicleId: 'v1', clientId: 'c1', deadline: '2025-12-31', parts: [], services: [] }, { requireAll: true })
      ).toThrow();
      try {
        parseOrderInput({ vehicleId: 'v1', clientId: 'c1', deadline: '2025-12-31', parts: [], services: [] }, { requireAll: true });
      } catch (e) {
        expect((e as ApiError).code).toBe('EMPTY_LINE_ITEMS');
      }
    });

    test('returns parsed input with requireAll true', () => {
      const result = parseOrderInput(
        {
          vehicleId: 'v1',
          clientId: 'c1',
          deadline: '2025-12-31T10:00:00Z',
          parts: [{ catalogPartId: 'p1', qty: 2, unitPrice: 38.5 }],
          services: [{ description: 'labor', costType: 'hourly', hours: 1.5, rate: 45 }],
        },
        { requireAll: true }
      );
      expect(result.vehicleId).toBe('v1');
      expect(result.clientId).toBe('c1');
      expect(result.deadline).toBeInstanceOf(Date);
      expect(result.parts).toEqual([{ catalogPartId: 'p1', qty: 2, unitPrice: 38.5 }]);
      expect(result.services).toEqual([{ description: 'labor', costType: 'hourly', hours: 1.5, rate: 45, fixedAmount: null }]);
    });

    test('does not throw for empty body with requireAll false', () => {
      const result = parseOrderInput({}, { requireAll: false });
      expect(result.vehicleId).toBe('');
      expect(result.clientId).toBe('');
      expect(result.parts).toEqual([]);
      expect(result.services).toEqual([]);
    });
  });
});

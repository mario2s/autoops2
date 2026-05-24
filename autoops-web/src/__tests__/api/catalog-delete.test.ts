/**
 * Delete-in-use guard tests. Runs LAST (after orders.test.ts) because the
 * 409 responses depend on orders that reference the catalog rows.
 */
import { apiRequest } from './http';
import { context } from './context';

describe('catalog delete (in-use guards)', () => {
  test('CAT-DEL-01 — Delete part referenced by an order (admin → 409)', async () => {
    const res = await apiRequest(`/api/v1/catalog/parts/${context.partId}`, {
      method: 'DELETE',
      token: context.adminToken,
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PART_IN_USE');
  });

  test('CAT-DEL-02 — Delete vehicle referenced by an order (admin → 409)', async () => {
    const res = await apiRequest(`/api/v1/catalog/vehicles/${context.vehicleId}`, {
      method: 'DELETE',
      token: context.adminToken,
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('VEHICLE_IN_USE');
  });

  test('CAT-DEL-03 — Delete client with vehicles/orders (admin → 409)', async () => {
    const res = await apiRequest(`/api/v1/catalog/clients/${context.clientId}`, {
      method: 'DELETE',
      token: context.adminToken,
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CLIENT_IN_USE');
  });
});

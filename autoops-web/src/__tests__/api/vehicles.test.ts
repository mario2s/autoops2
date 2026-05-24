import { apiRequest } from './http';
import { context } from './context';

describe('catalog/vehicles', () => {
  test('CAT-VEH-01 — Create vehicle with license plate only (mechanic)', async () => {
    const res = await apiRequest('/api/v1/catalog/vehicles', {
      method: 'POST',
      token: context.mechanicToken,
      body: { licensePlate: 'CB 1234 AB', clientId: context.clientId },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.licensePlate).toBe('CB 1234 AB');
    context.vehicleId = res.body.data.id;
  });

  test('CAT-VEH-02 — Create vehicle with description only', async () => {
    const res = await apiRequest('/api/v1/catalog/vehicles', {
      method: 'POST',
      token: context.mechanicToken,
      body: { description: 'The red Toyota' },
    });
    expect(res.status).toBe(201);
  });

  test('CAT-VEH-03 — Create vehicle with no plate and no description', async () => {
    const res = await apiRequest('/api/v1/catalog/vehicles', {
      method: 'POST',
      token: context.mechanicToken,
      body: { make: 'Toyota', year: 2019 },
    });
    expect(res.status).toBe(400);
  });

  test('CAT-VEH-04 — Create vehicle with all fields', async () => {
    const res = await apiRequest('/api/v1/catalog/vehicles', {
      method: 'POST',
      token: context.mechanicToken,
      body: {
        licensePlate: 'PA 9999 ZZ',
        description: 'Blue VW',
        make: 'Volkswagen',
        model: 'Golf',
        year: 2020,
        vin: '1HGBH41JXMN109186',
        clientId: context.clientId,
      },
    });
    expect(res.status).toBe(201);
    context.deletableVehicleId = res.body.data.id;
  });

  test('CAT-VEH-05 — Edit vehicle (admin only)', async () => {
    const res = await apiRequest(`/api/v1/catalog/vehicles/${context.vehicleId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: { description: 'Updated description' },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated description');
  });

  test('CAT-VEH-06 — Edit vehicle (mechanic — forbidden)', async () => {
    const res = await apiRequest(`/api/v1/catalog/vehicles/${context.vehicleId}`, {
      method: 'PATCH',
      token: context.mechanicToken,
      body: { description: 'Should fail' },
    });
    expect(res.status).toBe(403);
  });

  test('CAT-VEH-07 — List vehicles', async () => {
    const res = await apiRequest('/api/v1/catalog/vehicles', {
      token: context.mechanicToken,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
  });

  test('CAT-VEH-08 — Get vehicle by id', async () => {
    const res = await apiRequest(`/api/v1/catalog/vehicles/${context.vehicleId}`, {
      token: context.mechanicToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(context.vehicleId);
  });

  test('CAT-VEH-09 — Delete vehicle (mechanic — forbidden)', async () => {
    const res = await apiRequest(`/api/v1/catalog/vehicles/${context.deletableVehicleId}`, {
      method: 'DELETE',
      token: context.mechanicToken,
    });
    expect(res.status).toBe(403);
  });

  test('CAT-VEH-10 — Delete unused vehicle (admin)', async () => {
    const res = await apiRequest(`/api/v1/catalog/vehicles/${context.deletableVehicleId}`, {
      method: 'DELETE',
      token: context.adminToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(context.deletableVehicleId);
  });
});

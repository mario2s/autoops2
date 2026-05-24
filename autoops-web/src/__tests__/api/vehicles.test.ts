import { apiRequest } from './http';
import { context } from './context';

describe('vehicles', () => {
  test('VEH-01 — Create vehicle with license plate only (mechanic)', async () => {
    const res = await apiRequest('/api/v1/vehicles', {
      method: 'POST',
      token: context.mechanicToken,
      body: { licensePlate: 'CB 1234 AB', clientId: context.clientId },
    });
    expect(res.status).toBe(201);
    expect(res.body.data.licensePlate).toBe('CB 1234 AB');
    context.vehicleId = res.body.data.id;
  });

  test('VEH-02 — Create vehicle with description only', async () => {
    const res = await apiRequest('/api/v1/vehicles', {
      method: 'POST',
      token: context.mechanicToken,
      body: { description: 'The red Toyota' },
    });
    expect(res.status).toBe(201);
  });

  test('VEH-03 — Create vehicle with no plate and no description', async () => {
    const res = await apiRequest('/api/v1/vehicles', {
      method: 'POST',
      token: context.mechanicToken,
      body: { make: 'Toyota', year: 2019 },
    });
    expect(res.status).toBe(400);
  });

  test('VEH-04 — Create vehicle with all fields', async () => {
    const res = await apiRequest('/api/v1/vehicles', {
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
  });

  test('VEH-05 — Edit vehicle (admin only)', async () => {
    const res = await apiRequest(`/api/v1/vehicles/${context.vehicleId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: { description: 'Updated description' },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated description');
  });

  test('VEH-06 — Edit vehicle (mechanic — forbidden)', async () => {
    const res = await apiRequest(`/api/v1/vehicles/${context.vehicleId}`, {
      method: 'PATCH',
      token: context.mechanicToken,
      body: { description: 'Should fail' },
    });
    expect(res.status).toBe(403);
  });
});

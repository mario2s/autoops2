/**
 * Catalog Role Matrix — consolidated quick-verification suite.
 *
 * One row per cell of the Parts/Clients/Vehicles role matrix. Creates its own
 * fresh entities (admin) so it can run independently and clean up after itself.
 *
 *  Action                       | Admin | Mechanic
 *  -----------------------------+-------+----------
 *  View Parts                   |  ✅   |   ✅
 *  Create Part                  |  ✅   |   ✅
 *  Edit Part                    |  ✅   |   ❌ (403)
 *  Delete Part                  |  ✅   |   ❌ (403)
 *  View Clients                 |  ✅   |   ✅
 *  Create Client                |  ✅   |   ✅
 *  Edit Client                  |  ✅   |   ❌ (403)
 *  Delete Client                |  ✅   |   ❌ (403)
 *  View Vehicles                |  ✅   |   ✅
 *  Create Vehicle               |  ✅   |   ✅
 *  Edit Vehicle                 |  ✅   |   ❌ (403)
 *  Delete Vehicle               |  ✅   |   ❌ (403)
 *  Reassign Vehicle → Client    |  ✅   |   ❌ (403)
 */
import { apiRequest, isUuid } from './http';
import { context } from './context';

const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

describe('catalog-roles — Parts', () => {
  let partId = '';

  test('View Parts — mechanic ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/parts', { token: context.mechanicToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('View Parts — admin ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/parts', { token: context.adminToken });
    expect(res.status).toBe(200);
  });

  test('Create Part — mechanic ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/parts', {
      method: 'POST',
      token: context.mechanicToken,
      body: { name: `RoleMatrix Part Mech ${stamp()}` },
    });
    expect(res.status).toBe(201);
    expect(isUuid(res.body.data.id)).toBe(true);
  });

  test('Create Part — admin ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/parts', {
      method: 'POST',
      token: context.adminToken,
      body: { name: `RoleMatrix Part Admin ${stamp()}` },
    });
    expect(res.status).toBe(201);
    partId = res.body.data.id;
  });

  test('Edit Part — mechanic ❌ (403)', async () => {
    const res = await apiRequest(`/api/v1/catalog/parts/${partId}`, {
      method: 'PATCH',
      token: context.mechanicToken,
      body: { name: `RoleMatrix Part Mech-Renamed ${stamp()}` },
    });
    expect(res.status).toBe(403);
  });

  test('Edit Part — admin ✅', async () => {
    const newName = `RoleMatrix Part Admin-Renamed ${stamp()}`;
    const res = await apiRequest(`/api/v1/catalog/parts/${partId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: { name: newName },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(newName);
  });

  test('Delete Part — mechanic ❌ (403)', async () => {
    const res = await apiRequest(`/api/v1/catalog/parts/${partId}`, {
      method: 'DELETE',
      token: context.mechanicToken,
    });
    expect(res.status).toBe(403);
  });

  test('Delete Part — admin ✅', async () => {
    const res = await apiRequest(`/api/v1/catalog/parts/${partId}`, {
      method: 'DELETE',
      token: context.adminToken,
    });
    expect(res.status).toBe(200);
  });
});

describe('catalog-roles — Clients', () => {
  let clientId = '';
  let reassignTargetClientId = '';

  test('View Clients — mechanic ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/clients', { token: context.mechanicToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('View Clients — admin ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/clients', { token: context.adminToken });
    expect(res.status).toBe(200);
  });

  test('Create Client — mechanic ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/clients', {
      method: 'POST',
      token: context.mechanicToken,
      body: { name: `RoleMatrix Client Mech ${stamp()}` },
    });
    expect(res.status).toBe(201);
    reassignTargetClientId = res.body.data.id;
  });

  test('Create Client — admin ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/clients', {
      method: 'POST',
      token: context.adminToken,
      body: { name: `RoleMatrix Client Admin ${stamp()}` },
    });
    expect(res.status).toBe(201);
    clientId = res.body.data.id;
  });

  test('Edit Client — mechanic ❌ (403)', async () => {
    const res = await apiRequest(`/api/v1/catalog/clients/${clientId}`, {
      method: 'PATCH',
      token: context.mechanicToken,
      body: { notes: 'mechanic attempted edit' },
    });
    expect(res.status).toBe(403);
  });

  test('Edit Client — admin ✅', async () => {
    const res = await apiRequest(`/api/v1/catalog/clients/${clientId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: { notes: 'admin edit ok' },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('admin edit ok');
  });

  test('Delete Client — mechanic ❌ (403)', async () => {
    const res = await apiRequest(`/api/v1/catalog/clients/${clientId}`, {
      method: 'DELETE',
      token: context.mechanicToken,
    });
    expect(res.status).toBe(403);
  });

  test('Delete Client — admin ✅', async () => {
    const res = await apiRequest(`/api/v1/catalog/clients/${clientId}`, {
      method: 'DELETE',
      token: context.adminToken,
    });
    expect(res.status).toBe(200);
  });

  // Persist the reassign target so the Vehicles describe block can reuse it.
  test('persist reassign target client id for vehicle suite', () => {
    expect(isUuid(reassignTargetClientId)).toBe(true);
    (globalThis as any).__roleMatrixReassignClientId = reassignTargetClientId;
  });
});

describe('catalog-roles — Vehicles', () => {
  let vehicleId = '';
  let originalClientId = '';

  test('View Vehicles — mechanic ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/vehicles', { token: context.mechanicToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('View Vehicles — admin ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/vehicles', { token: context.adminToken });
    expect(res.status).toBe(200);
  });

  test('setup — admin creates owning client for vehicle', async () => {
    const res = await apiRequest('/api/v1/catalog/clients', {
      method: 'POST',
      token: context.adminToken,
      body: { name: `RoleMatrix Vehicle Owner ${stamp()}` },
    });
    expect(res.status).toBe(201);
    originalClientId = res.body.data.id;
  });

  test('Create Vehicle — mechanic ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/vehicles', {
      method: 'POST',
      token: context.mechanicToken,
      body: {
        licensePlate: `RM-MECH-${stamp().slice(0, 4).toUpperCase()}`,
        clientId: originalClientId,
      },
    });
    expect(res.status).toBe(201);
  });

  test('Create Vehicle — admin ✅', async () => {
    const res = await apiRequest('/api/v1/catalog/vehicles', {
      method: 'POST',
      token: context.adminToken,
      body: {
        licensePlate: `RM-ADM-${stamp().slice(0, 4).toUpperCase()}`,
        clientId: originalClientId,
      },
    });
    expect(res.status).toBe(201);
    vehicleId = res.body.data.id;
  });

  test('Edit Vehicle — mechanic ❌ (403)', async () => {
    const res = await apiRequest(`/api/v1/catalog/vehicles/${vehicleId}`, {
      method: 'PATCH',
      token: context.mechanicToken,
      body: { description: 'mechanic attempted edit' },
    });
    expect(res.status).toBe(403);
  });

  test('Edit Vehicle — admin ✅', async () => {
    const res = await apiRequest(`/api/v1/catalog/vehicles/${vehicleId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: { description: 'admin edit ok' },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('admin edit ok');
  });

  test('Reassign Vehicle → Client — mechanic ❌ (403)', async () => {
    const newClientId = (globalThis as any).__roleMatrixReassignClientId as string;
    expect(isUuid(newClientId)).toBe(true);
    const res = await apiRequest(`/api/v1/catalog/vehicles/${vehicleId}`, {
      method: 'PATCH',
      token: context.mechanicToken,
      body: { clientId: newClientId },
    });
    expect(res.status).toBe(403);
  });

  test('Reassign Vehicle → Client — admin ✅', async () => {
    const newClientId = (globalThis as any).__roleMatrixReassignClientId as string;
    const res = await apiRequest(`/api/v1/catalog/vehicles/${vehicleId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: { clientId: newClientId },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.clientId).toBe(newClientId);
  });

  test('Delete Vehicle — mechanic ❌ (403)', async () => {
    const res = await apiRequest(`/api/v1/catalog/vehicles/${vehicleId}`, {
      method: 'DELETE',
      token: context.mechanicToken,
    });
    expect(res.status).toBe(403);
  });

  test('Delete Vehicle — admin ✅', async () => {
    const res = await apiRequest(`/api/v1/catalog/vehicles/${vehicleId}`, {
      method: 'DELETE',
      token: context.adminToken,
    });
    expect(res.status).toBe(200);
  });
});

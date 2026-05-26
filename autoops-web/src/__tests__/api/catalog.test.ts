import { apiRequest, isUuid } from './http';
import { context } from './context';

describe('catalog/parts', () => {
  test('CAT-PARTS-01 — Create a part (mechanic)', async () => {
    const res = await apiRequest('/api/v1/catalog/parts', {
      method: 'POST',
      token: context.mechanicToken,
      body: { name: 'Test Brake Pads — Front' },
    });
    expect(res.status).toBe(201);
    expect(isUuid(res.body.data.id)).toBe(true);
    expect(res.body.data.name).toBe('Test Brake Pads — Front');
    context.partId = res.body.data.id;
  });

  test('CAT-PARTS-02 — Create duplicate part name', async () => {
    const res = await apiRequest('/api/v1/catalog/parts', {
      method: 'POST',
      token: context.mechanicToken,
      body: { name: 'Test Brake Pads — Front' },
    });
    expect(res.status).toBe(409);
  });

  test('CAT-PARTS-03 — Create part with missing name', async () => {
    const res = await apiRequest('/api/v1/catalog/parts', {
      method: 'POST',
      token: context.mechanicToken,
      body: {},
    });
    expect(res.status).toBe(400);
  });

  test('CAT-PARTS-04 — List parts (no filter)', async () => {
    const res = await apiRequest('/api/v1/catalog/parts', {
      token: context.mechanicToken,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination.pageSize).toBe(20);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('CAT-PARTS-05 — Search parts by name', async () => {
    const res = await apiRequest('/api/v1/catalog/parts?search=Brake', {
      token: context.mechanicToken,
    });
    expect(res.status).toBe(200);
    for (const item of res.body.data) {
      expect(item.name.toLowerCase()).toContain('brake');
    }
  });

  test('CAT-PARTS-06 — Search with less than 2 chars', async () => {
    const res = await apiRequest('/api/v1/catalog/parts?search=B', {
      token: context.mechanicToken,
    });
    expect(res.status).toBe(400);
  });

  test('CAT-PARTS-07 — Create part without auth', async () => {
    const res = await apiRequest('/api/v1/catalog/parts', {
      method: 'POST',
      body: { name: 'Unauthorized Part' },
    });
    expect(res.status).toBe(401);
  });

  test('CAT-PARTS-08 — Get part by id', async () => {
    const res = await apiRequest(`/api/v1/catalog/parts/${context.partId}`, {
      token: context.mechanicToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(context.partId);
  });

  test('CAT-PARTS-09 — Rename part (mechanic — forbidden)', async () => {
    const res = await apiRequest(`/api/v1/catalog/parts/${context.partId}`, {
      method: 'PATCH',
      token: context.mechanicToken,
      body: { name: 'Test Brake Pads — Front (renamed)' },
    });
    expect(res.status).toBe(403);
  });

  test('CAT-PARTS-09b — Rename part (admin)', async () => {
    const res = await apiRequest(`/api/v1/catalog/parts/${context.partId}`, {
      method: 'PATCH',
      token: context.adminToken,
      body: { name: 'Test Brake Pads — Front (renamed)' },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Test Brake Pads — Front (renamed)');
  });

  test('CAT-PARTS-10 — Delete part (mechanic — forbidden)', async () => {
    const res = await apiRequest(`/api/v1/catalog/parts/${context.partId}`, {
      method: 'DELETE',
      token: context.mechanicToken,
    });
    expect(res.status).toBe(403);
  });
});

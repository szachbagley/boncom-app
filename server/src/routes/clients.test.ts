import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as clientService from '../services/clients.js';

vi.mock('../services/clients.js');

describe('GET /api/clients', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the list from the service', async () => {
    const clients = [
      { id: 1, name: 'Acme Corp', createdAt: new Date(), updatedAt: new Date() },
    ];
    vi.mocked(clientService.listClients).mockResolvedValue(clients);

    const res = await request(createApp()).get('/api/clients');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Acme Corp');
    expect(clientService.listClients).toHaveBeenCalledOnce();
  });
});

describe('POST /api/clients', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates a client and returns 201', async () => {
    const created = { id: 1, name: 'Acme Corp', createdAt: new Date(), updatedAt: new Date() };
    vi.mocked(clientService.createClient).mockResolvedValue(created);

    const res = await request(createApp()).post('/api/clients').send({ name: 'Acme Corp' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Acme Corp');
    expect(clientService.createClient).toHaveBeenCalledWith({ name: 'Acme Corp' });
  });

  it('rejects a missing name with 400 and field-level detail', async () => {
    const res = await request(createApp()).post('/api/clients').send({});

    expect(res.status).toBe(400);
    expect(res.body.details.name).toBeDefined();
    expect(clientService.createClient).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only name with 400 (trim + min(1))', async () => {
    const res = await request(createApp()).post('/api/clients').send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(clientService.createClient).not.toHaveBeenCalled();
  });
});

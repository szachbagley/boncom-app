import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

/**
 * Cross-cutting HTTP-layer tests: CORS, malformed JSON, and the unknown-route
 * catch-all. These paths don't reach a service, so no DB or mocking is needed —
 * /health tolerates a missing DB (getHealthStatus catches failures and still
 * returns 200), so these pass with or without Docker running.
 */

const ALLOWED_ORIGIN = 'http://localhost:5173';
const DISALLOWED_ORIGIN = 'https://evil.example.com';

describe('CORS', () => {
  it('echoes Access-Control-Allow-Origin for an allowed origin', async () => {
    const res = await request(createApp()).get('/health').set('Origin', ALLOWED_ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });

  it('omits Access-Control-Allow-Origin for a disallowed origin', async () => {
    const res = await request(createApp())
      .get('/health')
      .set('Origin', DISALLOWED_ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('handles a preflight OPTIONS request for an allowed origin', async () => {
    const res = await request(createApp())
      .options('/api/estimates')
      .set('Origin', ALLOWED_ORIGIN)
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    expect(res.status).toBeLessThan(300);
  });
});

describe('malformed JSON body', () => {
  it('returns 400 with a clean message instead of a 500', async () => {
    const res = await request(createApp())
      .post('/api/clients')
      .set('Content-Type', 'application/json')
      .send('{ this is not valid json');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Malformed JSON in request body' });
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404, not the default Express HTML page', async () => {
    const res = await request(createApp()).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});

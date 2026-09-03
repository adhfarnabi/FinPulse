import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('smoke tests (no database required)', () => {
  it('returns 404 for an unknown route', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('blocks protected routes without a token before touching the DB', async () => {
    const res = await request(app).get('/api/v1/portfolio');
    expect(res.status).toBe(401);
  });

  it('blocks protected routes with a malformed token', async () => {
    const res = await request(app).get('/api/v1/watchlists').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('rejects registration with missing fields before touching the DB', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'x@example.com' });
    expect(res.status).toBe(400);
  });
});

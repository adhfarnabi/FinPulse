import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mongoose } from '../../shared/db/connect';
import { createApp } from '../src/app';
import { Stock } from '../../shared/models';

let mongod: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  await Stock.create({
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries',
    exchange: 'NSE',
    sector: 'Energy',
    currency: 'INR',
    isActive: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('GET /api/health', () => {
  it('reports mongo connected (kafka will show disconnected — no broker in this test)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.dependencies.mongodb).toBe('connected');
    expect(res.body).toHaveProperty('dataMode');
  });
});

describe('GET /api/v1/stocks', () => {
  it('lists seeded stocks', async () => {
    const res = await request(app).get('/api/v1/stocks');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].symbol).toBe('RELIANCE');
  });

  it('returns 404 for an unknown symbol', async () => {
    const res = await request(app).get('/api/v1/stocks/DOESNOTEXIST');
    expect(res.status).toBe(404);
  });
});

describe('Auth flow', () => {
  const email = 'trader@example.com';
  const password = 'correct-horse-battery';

  it('registers a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'Trader', email, password });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'Trader', email, password });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/v1/portfolio');
    expect(res.status).toBe(401);
  });

  it('allows protected routes with a valid token, and isolates users', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email, password });
    const token = login.body.token;

    const portfolioRes = await request(app).get('/api/v1/portfolio').set('Authorization', `Bearer ${token}`);
    expect(portfolioRes.status).toBe(200);
    expect(portfolioRes.body.positions).toEqual([]);

    // a second user must not see the first user's watchlists
    const other = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Other', email: 'other@example.com', password: 'another-password-1' });

    await request(app)
      .post('/api/v1/watchlists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My List' });

    const otherWatchlists = await request(app)
      .get('/api/v1/watchlists')
      .set('Authorization', `Bearer ${other.body.token}`);
    expect(otherWatchlists.body).toEqual([]);
  });
});

describe('Alert rules validation', () => {
  it('rejects an alert rule for a stock that does not exist', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'trader@example.com', password: 'correct-horse-battery' });
    const token = login.body.token;

    const res = await request(app)
      .post('/api/v1/alert-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'NOPE', ruleType: 'PRICE_CHANGE', operator: '>', threshold: 5 });
    expect(res.status).toBe(404);
  });

  it('creates a valid alert rule', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'trader@example.com', password: 'correct-horse-battery' });
    const token = login.body.token;

    const res = await request(app)
      .post('/api/v1/alert-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'RELIANCE', ruleType: 'PRICE_CHANGE', operator: '>', threshold: 5 });
    expect(res.status).toBe(201);
    expect(res.body.symbol).toBe('RELIANCE');
  });
});

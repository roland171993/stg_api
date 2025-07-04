const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../../src/app'); // ensure this exports your Express app

describe('Auth API (Users)', () => {
  let app, server, token;
  const testUser = { username: 'testuser', password: 'Passw0rd!' };

  beforeAll(async () => {
    app = await createApp();
    server = request(app);
    await mongoose.connection.collection('users').deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('registers a new user', async () => {
    const res = await server
      .post('/api/auth/register')
      .send(testUser)
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('rejects duplicate registration', async () => {
    const res = await server
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(409);
  });

  it('logs in with valid credentials', async () => {
    const res = await server
      .post('/api/auth/login')
      .send(testUser);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('rejects invalid login', async () => {
    const res = await server
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
  });
});

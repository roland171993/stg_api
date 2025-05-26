const request = require('supertest');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const createApp = require('../../src/app');

describe('Cover Letters API (CRUD + pagination)', () => {
  let app, server, token;
  const testUser = { username: 'lettertester', password: 'Letter123!' };
  const createdIds = [];

  beforeAll(async () => {
    app    = await createApp();
    server = request(app);
    await mongoose.connection.dropDatabase();

    // auth setup
    await server.post('/api/auth/register').send(testUser);
    const login = await server.post('/api/auth/login').send(testUser);
    token = login.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('creates 30 dummy cover letters', async () => {
    for (let i = 0; i < 30; i++) {
      const dummy = {
        title: faker.lorem.words(3),
        content: faker.lorem.paragraph()
      };
      const res = await server
        .post('/api/cover-letters')
        .set('Authorization', `Bearer ${token}`)
        .send(dummy);
      expect(res.statusCode).toBe(201);
      expect(res.body.coverLetter).toHaveProperty('_id');
      createdIds.push(res.body.coverLetter._id);
    }
  });

  it('updates 5 of the created cover letters', async () => {
    for (let i = 0; i < 5; i++) {
      const id = createdIds[i];
      const res = await server
        .put(`/api/cover-letters/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `Updated Cover Letter ${i}` });
      expect(res.statusCode).toBe(200);
      expect(res.body.coverLetter.title).toBe(`Updated Cover Letter ${i}`);
    }
  });

  it('deletes 5 of the created cover letters', async () => {
    for (let i = 0; i < 5; i++) {
      const id = createdIds[i];
      const res = await server
        .delete(`/api/cover-letters/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(204);
    }
  });

  it('verifies 25 total cover letters across pages', async () => {
    // Page 1
    const res1 = await server.get('/api/cover-letters');
    expect(res1.statusCode).toBe(200);
    expect(Array.isArray(res1.body.coverLetters)).toBe(true);
    expect(res1.body.coverLetters).toHaveLength(15);
    expect(res1.body.pagination).toMatchObject({
      total: 25,
      page: 1,
      totalPages: 2,
      limit: 15
    });

    // Page 2
    const res2 = await server.get('/api/cover-letters').query({ page: 2 });
    expect(res2.statusCode).toBe(200);
    expect(Array.isArray(res2.body.coverLetters)).toBe(true);
    expect(res2.body.coverLetters).toHaveLength(10);
    expect(res2.body.pagination).toMatchObject({
      total: 25,
      page: 2,
      totalPages: 2,
      limit: 15
    });
  });
});
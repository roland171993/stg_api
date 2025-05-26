// tests/routes/resumes.e2e.test.js

const request = require('supertest');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const createApp = require('../../src/app');

describe('Resumes API (CRUD)', () => {
  let app, server, token;
  const testUser = { username: 'resumetester', password: 'Resume123!' };
  const createdIds = [];

  beforeAll(async () => {
    app = await createApp();
    server = request(app);
    await mongoose.connection.dropDatabase();

    // register & login
    await server.post('/api/auth/register').send(testUser);
    const loginRes = await server.post('/api/auth/login').send(testUser);
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('creates 30 dummy resumes', async () => {
    for (let i = 0; i < 30; i++) {
      const dummy = {
        title: faker.lorem.words(3),
        downloadUrl: faker.internet.url(),
        content: faker.lorem.paragraph(),
      };
      const res = await server
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(dummy)
        .set('Accept', 'application/json');
      expect(res.statusCode).toBe(201);
      expect(res.body.resume).toHaveProperty('_id');
      createdIds.push(res.body.resume._id);
    }
  });

  it('updates 5 of the created resumes', async () => {
    for (let i = 0; i < 5; i++) {
      const id = createdIds[i];
      const res = await server
        .put(`/api/resumes/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `Updated Resume Title ${i}` });
      expect(res.statusCode).toBe(200);
      expect(res.body.resume.title).toBe(`Updated Resume Title ${i}`);
    }
  });

  it('deletes 5 of the created resumes', async () => {
    for (let i = 0; i < 5; i++) {
      const id = createdIds[i];
      const res = await server
        .delete(`/api/resumes/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(204);
    }
  });

  it('verifies 25 total resumes across pages', async () => {
    // Page 1
    const res1 = await server.get('/api/resumes');
    expect(res1.statusCode).toBe(200);
    // page 1 should have 15 items
    expect(Array.isArray(res1.body.resumes)).toBe(true);
    expect(res1.body.resumes).toHaveLength(15);
    // pagination metadata should report 25 total
    expect(res1.body.pagination).toMatchObject({
      total: 25,
      page: 1,
      totalPages: 2,
      limit: 15
    });

    // Page 2
    const res2 = await server.get('/api/resumes').query({ page: 2 });
    expect(res2.statusCode).toBe(200);
    // page 2 should have the remaining 10
    expect(Array.isArray(res2.body.resumes)).toBe(true);
    expect(res2.body.resumes).toHaveLength(10);
    // metadata on page 2
    expect(res2.body.pagination).toMatchObject({
      total: 25,
      page: 2,
      totalPages: 2,
      limit: 15
    });
  });
});

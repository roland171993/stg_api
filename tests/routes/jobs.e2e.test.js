const request = require('supertest');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const createApp = require('../../src/app');

describe('Jobs API (CRUD + pagination)', () => {
  let app, server, token;
  const testUser = { username: 'jobtester', password: 'JobPass123!' };
  const createdJobIds = [];

  beforeAll(async () => {
    app    = await createApp();
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

  it('creates 30 dummy jobs', async () => {
    for (let i = 0; i < 30; i++) {
      const dummy = {
        title: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        authorEmail: faker.internet.email(),
        company: faker.company.name(),
        city: faker.address.city(),
        educationLevel: 'Bachelor',
        sector: { id: '1', name: 'IT' },
        gender: { id: '1', name: 'Any' },
        contractType: { id: '1', name: 'Full-time' },
        workMode: { id: '1', name: 'Remote' },
        deadline: faker.date.soon().toISOString()
      };
      const res = await server
        .post('/api/jobs')
        .set('Authorization', `Bearer ${token}`)
        .send(dummy);
      expect(res.statusCode).toBe(201);
      expect(res.body.job).toHaveProperty('_id');
      createdJobIds.push(res.body.job._id);
    }
  });

  it('updates 5 of the created jobs', async () => {
    for (let i = 0; i < 5; i++) {
      const id = createdJobIds[i];
      const res = await server
        .put(`/api/jobs/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `Updated Job Title ${i}` });
      expect(res.statusCode).toBe(200);
      expect(res.body.job.title).toBe(`Updated Job Title ${i}`);
    }
  });

  it('deletes 5 of the created jobs', async () => {
    for (let i = 0; i < 5; i++) {
      const id = createdJobIds[i];
      const res = await server
        .delete(`/api/jobs/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(204);
    }
  });

  it('verifies 25 total jobs across pages', async () => {
    // Page 1
    const res1 = await server.get('/api/jobs');
    expect(res1.statusCode).toBe(200);
    expect(Array.isArray(res1.body.jobs)).toBe(true);
    expect(res1.body.jobs).toHaveLength(15);
    expect(res1.body.pagination).toMatchObject({
      total: 25,
      page: 1,
      totalPages: 2,
      limit: 15
    });

    // Page 2
    const res2 = await server.get('/api/jobs').query({ page: 2 });
    expect(res2.statusCode).toBe(200);
    expect(Array.isArray(res2.body.jobs)).toBe(true);
    expect(res2.body.jobs).toHaveLength(10);
    expect(res2.body.pagination).toMatchObject({
      total: 25,
      page: 2,
      totalPages: 2,
      limit: 15
    });
  });
});

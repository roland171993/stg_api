// tests/routes/jobs.e2e.test.js

const request = require('supertest');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const createApp = require('../../src/app'); // will connect to MongoDB via src/config/database.js

describe('Jobs API (CRUD)', () => {
  let app;
  let server;

  // store created job IDs for later tests
  const createdJobIds = [];

  beforeAll(async () => {
    // boot the app (includes DB connect) :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
    app = await createApp();
    server = request(app);
    // start fresh
    await mongoose.connection.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should create 30 dummy jobs', async () => {
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
        .send(dummy)
        .set('Accept', 'application/json');

      expect(res.statusCode).toBe(201);
      expect(res.body.job).toHaveProperty('_id');
      createdJobIds.push(res.body.job._id);
    }
  });

  it('should update 5 of the created jobs', async () => {
    for (let i = 0; i < 5; i++) {
      const id = createdJobIds[i];
      const newTitle = `Updated Job Title ${i}`;
      const res = await server
        .put(`/api/jobs/${id}`)
        .send({ title: newTitle });

      expect(res.statusCode).toBe(200);
      expect(res.body.job.title).toBe(newTitle);
    }
  });

  it('should delete 5 of the created jobs', async () => {
    for (let i = 0; i < 5; i++) {
      const id = createdJobIds[i];
      const res = await server.delete(`/api/jobs/${id}`);
      expect(res.statusCode).toBe(204);
    }
  });

  it('should have exactly 25 jobs remaining', async () => {
    const res = await server.get('/api/jobs');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.jobs).toHaveLength(25);
  });
});

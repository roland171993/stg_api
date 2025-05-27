const jobsRoutes = require('../../src/routes/jobs.routes');

describe('Jobs Routes', () => {
  it('defines CRUD paths for jobs', () => {
    const routes = jobsRoutes.stack.filter(l => l.route).map(l => ({
      path: l.route.path,
      methods: Object.keys(l.route.methods)
    }));
    expect(routes).toEqual(expect.arrayContaining([
      { path:'/', methods: expect.arrayContaining(['get','post']) },
      { path:'/:id', methods: expect.arrayContaining(['get','put','delete']) }
    ]));
  });
});
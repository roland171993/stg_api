const resumesRoutes = require('../../routes/resumes.routes');

describe('Resumes Routes', () => {
  it('defines CRUD paths for resumes', () => {
    const routes = resumesRoutes.stack.filter(l => l.route).map(l => ({
      path: l.route.path,
      methods: Object.keys(l.route.methods)
    }));
    expect(routes).toEqual(expect.arrayContaining([
      { path:'/', methods: expect.arrayContaining(['get','post']) },
      { path:'/:id', methods: expect.arrayContaining(['get','put','delete']) }
    ]));
  });
});
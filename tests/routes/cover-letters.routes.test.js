const coverRoutes = require('../../routes/cover-letters.routes');

describe('Cover Letters Routes', () => {
  it('defines CRUD paths for cover letters', () => {
    const routes = coverRoutes.stack.filter(l => l.route).map(l => ({
      path: l.route.path,
      methods: Object.keys(l.route.methods)
    }));
    expect(routes).toEqual(expect.arrayContaining([
      { path:'/', methods: expect.arrayContaining(['get','post']) },
      { path:'/:id', methods: expect.arrayContaining(['get','put','delete']) }
    ]));
  });
});
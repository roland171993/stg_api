const jobsRoutes = require('../../src/routes/jobs.routes');

describe('Jobs Routes', () => {
  it('defines CRUD paths for jobs', () => {
    const routeMap = {};

    // Aggregate HTTP methods per route path
    jobsRoutes.stack.forEach((layer) => {
      if (layer.route) {
        const path = layer.route.path;
        const methods = Object.keys(layer.route.methods);

        if (!routeMap[path]) {
          routeMap[path] = new Set();
        }

        methods.forEach(method => routeMap[path].add(method));
      }
    });

    // Convert aggregated data into array format
    const routes = Object.entries(routeMap).map(([path, methodsSet]) => ({
      path,
      methods: Array.from(methodsSet)
    }));

    // Validate expected structure
    expect(routes).toEqual(expect.arrayContaining([
      { path: '/', methods: expect.arrayContaining(['get', 'post']) },
      { path: '/:id', methods: expect.arrayContaining(['get', 'put', 'delete']) }
    ]));
  });
});

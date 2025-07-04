const resumesRoutes = require('../../src/routes/resumes.routes');

describe('Resumes Routes', () => {
  it('defines CRUD paths for resumes', () => {
    const routeMap = {};

    // Aggregate methods per route path
    resumesRoutes.stack.forEach((layer) => {
      if (layer.route) {
        const path = layer.route.path;
        const methods = Object.keys(layer.route.methods);

        if (!routeMap[path]) {
          routeMap[path] = new Set();
        }

        methods.forEach((method) => routeMap[path].add(method));
      }
    });

    // Convert map to array format for comparison
    const routes = Object.entries(routeMap).map(([path, methodsSet]) => ({
      path,
      methods: Array.from(methodsSet)
    }));

    // Validate expected route definitions
    expect(routes).toEqual(expect.arrayContaining([
      { path: '/', methods: expect.arrayContaining(['get', 'post']) },
      { path: '/:id', methods: expect.arrayContaining(['get', 'put', 'delete']) }
    ]));
  });
});

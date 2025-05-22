const commonRoutes = require('../../routes/common.routes');

describe('Common Routes', () => {
  it('has lookup GET endpoints', () => {
    const expected = ['/sectors','/genders','/contract-types','/work-modes'];
    const paths = commonRoutes.stack.filter(l => l.route).map(l => l.route.path);
    expected.forEach(p => expect(paths).toContain(p));
    expected.forEach(p => {
      const layer = commonRoutes.stack.find(l => l.route.path === p);
      expect(layer.route.methods.get).toBe(true);
    });
  });
});
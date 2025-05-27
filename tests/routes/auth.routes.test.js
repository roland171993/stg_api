const authRoutes = require('../../src/routes/auth.routes');

describe('Auth Routes', () => {
  it('has /login POST and /me GET', () => {
    expect(Array.isArray(authRoutes.stack)).toBe(true);
    const paths = authRoutes.stack.map(l => l.route && l.route.path).filter(Boolean);
    expect(paths).toContain('/login');
    expect(paths).toContain('/me');
    const login = authRoutes.stack.find(l => l.route.path === '/login');
    expect(login.route.methods.post).toBe(true);
    const me = authRoutes.stack.find(l => l.route.path === '/me');
    expect(me.route.methods.get).toBe(true);
  });
});
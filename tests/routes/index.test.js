const apiRouter = require('../../src/routes/index');

describe('API Index Router', () => {
  it('mounts feature routers', () => {
    const mounts = apiRouter.stack.filter(l => l.name === 'router');
    const rxps = mounts.map(l => l.regexp.toString());
    ['\\/auth','\\/jobs','\\/resumes','\\/cover\\-letters'].forEach(fragment =>
      expect(rxps.some(r => r.includes(fragment))).toBe(true)
    );
  });
});
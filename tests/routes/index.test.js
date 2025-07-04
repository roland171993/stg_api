const apiRouter = require('../../src/routes/index');

describe('API Index Router', () => {
  it('mounts feature routers', () => {
    const mounts = apiRouter.stack.filter(l => l.name === 'router');
    const regexps = mounts.map(l => l.regexp);

    const expectedPaths = [
      '/auth',
      '/jobs',
      '/resumes',
      '/cover-letters'
    ];

    expectedPaths.forEach(expectedPath => {
      const matched = regexps.some(r => r.test(expectedPath));
      expect(matched).toBe(true);
    });
  });
});

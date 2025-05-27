const Resume = require('../../src/models/resume.model');

describe('Resume Model', () => {
  it('defaults unpublished to false', () => {
    const r = new Resume({ title:'T', downloadUrl:'u', content:'c' });
    expect(r.unpublished).toBe(false);
  });
});
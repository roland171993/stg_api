const CoverLetter = require('../../src/models/cover-letter.model');

describe('Cover Letter Model', () => {
  it('defaults unpublished to false', () => {
    const c = new CoverLetter({ title:'T', content:'c' });
    expect(c.unpublished).toBe(false);
  });
});
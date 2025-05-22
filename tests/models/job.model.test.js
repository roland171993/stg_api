const Job = require('../../models/job.model');

describe('Job Model', () => {
  it('defaults unpublished to false', () => {
    const data = {
      title: 'T', description: 'D', authorEmail:'e@e.com',
      company:'C', city:'C', educationLevel:'B',
      sector:{ name:'S' }, gender:{ name:'G' },
      contractType:{ name:'CT' }, workMode:{ name:'WM' },
      deadline:new Date()
    };
    const job = new Job(data);
    expect(job.unpublished).toBe(false);
  });
});
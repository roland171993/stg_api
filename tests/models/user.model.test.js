const bcrypt = require('bcryptjs');
const User = require('../../models/user.model');

describe('User Model', () => {
  it('defines comparePassword', () => {
    expect(typeof User.schema.methods.comparePassword).toBe('function');
  });

  it('validate correct password', async () => {
    const plain = 'secret';
    const hash = await bcrypt.hash(plain, 10);
    const user = new User({ username: 'x', password: hash });
    expect(await user.comparePassword(plain)).toBe(true);
  });

  it('reject incorrect password', async () => {
    const hash = await bcrypt.hash('secret', 10);
    const user = new User({ username: 'x', password: hash });
    expect(await user.comparePassword('wrong')).toBe(false);
  });
});
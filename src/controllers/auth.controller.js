const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

exports.register = async (req, res, next) => {
   try {
     const { username, password } = req.body;
     if (!username || !password) {
       return res
         .status(400)
         .json({ message: 'Username and password are required.' });
     }

     // Check for existing user
     const existing = await User.findOne({ username });
     if (existing) {
       return res
         .status(409)
         .json({ message: 'Username already taken.' });
     }

     // Create & save
     const user = new User({ username, password });
     await user.save();

     // Issue token (expires in same 7mo as login)
     const token = jwt.sign(
       { sub: user._id, username: user.username },
       config.jwtSecret,
       { expiresIn: '210d' }
     );

     // 201 Created!
     res.status(201).json({ token });
   } catch (err) {
     next(err);
   }
 };

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // roughly seven months (right is '1h')

    const token = jwt.sign(
      { sub: user._id, username: user.username },
      config.jwtSecret,
      { expiresIn: '210d' }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    // Assumes auth middleware has set req.userId
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

const jwt = require('jsonwebtoken');
const config = require('../config');

function decodeFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    // Expecting a payload like: { sub: <userId>, role?: 'admin' | 'user' | ... }
    const payload = jwt.verify(token, config.jwtSecret);
    return payload;
  } catch {
    return null;
  }
}

// Attach req.user if token is valid; otherwise leave req.user undefined 
function optional(req, res, next) {
  const payload = decodeFromHeader(req);
  if (payload) {
    req.user = { id: payload.sub, role: payload.role };
    req.userId = payload.sub;
  }
  next();
}

// Require a valid token 
function required(req, res, next) {
  const payload = decodeFromHeader(req);
  if (!payload) {
    return res.status(401).json({ message: 'Authorization header missing, malformed, or token invalid.' });
  }
  req.user = { id: payload.sub, role: payload.role };
  req.userId = payload.sub;
  next();
}

// Require a valid token AND admin role 
function requireAdmin(req, res, next) {
  const payload = decodeFromHeader(req);
  if (!payload) {
    return res.status(401).json({ message: 'Authorization header missing, malformed, or token invalid.' });
  }
  if (payload.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required.' });
  }
  req.user = { id: payload.sub, role: payload.role };
  req.userId = payload.sub;
  next();
}

module.exports = { optional, required, requireAdmin };

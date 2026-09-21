const jwt = require('jsonwebtoken');

// Ensure you have JWT_SECRET in your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'eventcards_super_secret_key_2026';

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user ID and role to the request
    next();
  } catch (err) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

module.exports = { protect, JWT_SECRET };
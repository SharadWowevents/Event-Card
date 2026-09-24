const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Renamed from 'authMiddleware' to 'protect' to match your routes
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // 1. Verify the token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. CRITICAL FIX: Check if the user still exists in the Database
    const userExists = await User.findById(decoded.id); 
    if (!userExists) {
      return res.status(401).json({ message: 'User account has been removed or disabled.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid' });
  }
};

// Export BOTH 'protect' and 'JWT_SECRET' exactly as teamRoutes.js expects them
module.exports = { 
  protect, 
  JWT_SECRET: process.env.JWT_SECRET 
};
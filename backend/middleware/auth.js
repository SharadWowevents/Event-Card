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

// Role-based protection: Only Super Admin can access Activity Logs and Backup/Restore
const requireSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.query?.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User account not found' });
      }
      const roleClean = (user.role || '').toLowerCase().replace(/[\s_-]+/g, '');
      if (roleClean !== 'superadmin') {
        return res.status(403).json({ error: 'Access Denied: Only Super Admin has permission to access this resource.' });
      }
      req.user = user;
      return next();
    }

    // Role header check if token not supplied (or query parameter for direct download)
    const roleHeader = req.headers['x-user-role'] || req.query?.role;
    if (roleHeader) {
      const roleClean = roleHeader.toLowerCase().replace(/[\s_-]+/g, '');
      if (roleClean !== 'superadmin') {
        return res.status(403).json({ error: 'Access Denied: Only Super Admin has permission to access this resource.' });
      }
      return next();
    }

    return res.status(403).json({ error: 'Access Denied: Super Admin authentication required.' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

// Export 'protect', 'requireSuperAdmin', and 'JWT_SECRET'
module.exports = { 
  protect, 
  requireSuperAdmin,
  JWT_SECRET: process.env.JWT_SECRET 
};
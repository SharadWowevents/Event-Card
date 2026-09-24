const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Or your TeamMember/Admin model

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // 1. Verify the token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. CRITICAL FIX: Check if the user still exists in the Database!
    const userExists = await User.findById(decoded.id); 
    if (!userExists) {
      // If they were deleted from the Team page, throw a 401 Unauthorized
      return res.status(401).json({ message: 'User account has been removed or disabled.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid' });
  }
};

module.exports = authMiddleware;
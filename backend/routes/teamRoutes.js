const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, JWT_SECRET } = require('../middleware/auth');

// 1. Initialize First Master Admin
const initializeMasterAdmin = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await User.create({
      name: 'Master Admin',
      email: 'admin@eventcards.io',
      password: hashedPassword,
      role: 'Superadmin',
      status: 'Active'
    });
    console.log('Master admin created: admin@eventcards.io / admin123');
  }
};
initializeMasterAdmin();

// 2. Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    user.lastActive = Date.now();
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get All Team Members (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const team = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Invite New Team Member (Protected)
router.post('/invite', protect, async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      status: 'Invited'
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({ user: userResponse, tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Change/Reset Password (Protected)
router.put('/:id/password', protect, async (req, res) => {
  try {
    // Only Superadmins or the specific user can change this password
    if (req.user.role !== 'Superadmin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized to change this password' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Automatically set them to Active if they were just "Invited"
    if (user.status === 'Invited') {
      user.status = 'Active';
    }

    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Remove Team Member (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Superadmin') {
      return res.status(403).json({ error: 'Only Superadmins can remove members' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
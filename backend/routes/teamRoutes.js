const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, JWT_SECRET } = require('../middleware/auth');
const activityLogger = require('../services/activityLogger');

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

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        themePreference: user.themePreference || 'dark'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current Authenticated User Profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      themePreference: user.themePreference || 'dark'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Current User Theme Preference (Protected)
router.patch('/theme', protect, async (req, res) => {
  try {
    const { themePreference } = req.body;
    if (!['dark', 'light'].includes(themePreference)) {
      return res.status(400).json({ error: "themePreference must be 'dark' or 'light'" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { themePreference },
      { returnDocument: 'after' }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        themePreference: user.themePreference
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Notification Read State (Protected)
router.get('/notifications/read-state', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('readNotificationIds lastNotificationsReadAt');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      readNotificationIds: user.readNotificationIds || [],
      lastNotificationsReadAt: user.lastNotificationsReadAt || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Notifications As Read (Protected)
router.post('/notifications/mark-read', protect, async (req, res) => {
  try {
    const { ids, markAll, readAt } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const update = {};
    if (markAll) {
      update.lastNotificationsReadAt = readAt ? new Date(readAt) : new Date();
    }
    if (Array.isArray(ids) && ids.length > 0) {
      const existing = new Set((user.readNotificationIds || []).map(String));
      ids.forEach(id => {
        if (id) existing.add(String(id));
      });
      // Cap at 500 items to avoid unbounded document growth
      update.readNotificationIds = Array.from(existing).slice(-500);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      update,
      { returnDocument: 'after' }
    ).select('readNotificationIds lastNotificationsReadAt');

    res.json({
      success: true,
      readNotificationIds: updatedUser.readNotificationIds || [],
      lastNotificationsReadAt: updatedUser.lastNotificationsReadAt || null
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
    const previous = await User.findById(req.params.id);
    if (!previous) return res.status(404).json({ error: 'User not found' });

    await User.findByIdAndDelete(req.params.id);

    await activityLogger.log({
      action: 'DELETE_USER',
      entityType: 'User',
      entityId: req.params.id,
      description: `Removed team member "${previous.name}" (${previous.email})`,
      performedBy: req.user.name || req.user.email || 'Superadmin',
      previousState: previous.toObject(),
      canUndo: true
    }).catch(err => console.error('Failed to log user deletion:', err));

    res.json({ success: true, message: 'User removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update Team Member Role (Protected)
router.put('/:id/role', protect, async (req, res) => {
  try {
    const actorRole = (req.user.role || '').toLowerCase().replace(/[\s_-]+/g, '');
    if (actorRole !== 'superadmin') {
      return res.status(403).json({ error: 'Only Superadmins can update member roles' });
    }

    const { role } = req.body;
    const validRoles = ['Superadmin', 'Event Admin', 'Viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent demoting the last Superadmin if self-demoting
    if (String(user._id) === String(req.user.id) && role !== 'Superadmin') {
      const superAdminCount = await User.countDocuments({ role: 'Superadmin' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last remaining Superadmin.' });
      }
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    // Log the activity for audit & undo
    await activityLogger.log({
      action: 'UPDATE_USER_ROLE',
      entityType: 'User',
      entityId: user._id,
      description: `Changed role for "${user.name}" (${user.email}) from ${previousRole} to ${role}`,
      performedBy: req.user.name || req.user.email || 'Superadmin',
      previousState: { role: previousRole },
      newState: { role },
      canUndo: true
    }).catch(err => console.error('Failed to log role update:', err));

    res.json({
      success: true,
      user: userObj,
      message: `Role for ${user.name} updated to ${role} successfully`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
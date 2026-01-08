const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { verifyToken } = require('../middleware/auth');

// @route   POST /api/auth/sync
// @desc    Sync Firebase user with MongoDB Member model
// @access  Private (after Firebase Login)
router.post('/sync', verifyToken, async (req, res) => {
  try {
    let member = await Member.findOne({ firebaseUid: req.user.uid });

    if (!member) {
      // Extract names from display name or email
      const displayName = req.user.name || req.user.email.split('@')[0];
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || 'Member';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      // Create new member record on first login
      member = new Member({
        personalInfo: {
          firstName,
          lastName,
        },
        email: req.user.email,
        firebaseUid: req.user.uid,
        role: req.user.email.includes('admin') ? 'admin' : 'staff',
      });
      await member.save();
    } else if (!member.role) {
      // Fallback for existing members created without a role field
      member.role = req.user.email.includes('admin') ? 'admin' : 'staff';
      await member.save();
    }

    res.json(member);
  } catch (err) {
    res.status(500).json({ message: 'Sync failed', error: err.message });
  }
});

module.exports = router;
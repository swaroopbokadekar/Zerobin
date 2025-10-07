const express = require('express');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { sendClaimMail } = require('../utils/mailer');

const router = express.Router();

// Middleware: auth check
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Create donation
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, quantity, contact, donorName, location, lat, lng, expiryDate } = req.body;

    const donation = await Donation.create({
      title, description, quantity, contact, donorName, location, lat, lng, expiryDate,
      donor: req.user.id
    });

    res.json({ message: 'Donation created successfully', donation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all donations
router.get('/', auth, async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Claim donation (NGO)
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    donation.status = 'accepted';
    donation.ngo = req.user.id;
    await donation.save();

    const donor = await User.findById(donation.donor);
    const ngo = await User.findById(req.user.id);

    if (donor?.email) {
      await sendClaimMail(donor.email, donation.title, ngo?.name || 'an NGO');
    }

    res.json({ message: 'Donation claimed and donor notified', donation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

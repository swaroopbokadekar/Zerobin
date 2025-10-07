const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  quantity: String,
  contact: { type: String, required: true },
  donorName: { type: String, required: true },
  location: { type: String, required: true }, // full address string
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  expiryDate: Date,
  status: { type: String, enum: ['available','accepted','picked'], default: 'available' },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Donation', DonationSchema);

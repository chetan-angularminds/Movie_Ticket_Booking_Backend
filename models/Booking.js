const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  seats: [{ row: Number, seatNumber: Number }],
  totalPrice: { type: Number, required: true },
  bookingDate: { type: Date, default: Date.now },
  email: {type: String, required: true},
  name: {type: String, required: true},
  phoneNumber: {type: String, required: true}
});

module.exports = mongoose.model('Booking', bookingSchema);


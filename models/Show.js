const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  theater: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true },
  seatPrice: {type: Number, required: true},
  showTime: [{ type: String, required: true }],
  date: { type: Date, required: true },
  availableSeats: { type: Number, required: true },
  bookedSeats: [{ row: Number, seatNumber: Number }]
});

module.exports = mongoose.model('Show', showSchema);


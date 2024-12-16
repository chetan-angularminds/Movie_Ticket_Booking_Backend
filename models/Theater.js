const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  seatsCapacity: { type: Number, required: true },
  numberOfRows: { type: Number, required: true },
  seatsPerRow: { type: Number, required: true },
  address: { type: String, required: true },
  city: {type: String, required: true},
  showTimings: [{ type: String, required: true }]
});

module.exports = mongoose.model('Theater', theaterSchema);


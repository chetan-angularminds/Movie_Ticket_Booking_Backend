const mongoose = require('mongoose');

const bulkShowSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  theaters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Theater' }],
  seatPrice: {type: Number, required: true},
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
});

module.exports = mongoose.model('BulkShow', bulkShowSchema);


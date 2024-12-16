const express = require('express');
const Theater = require('../models/Theater');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const BulkShow = require('../models/BulkShow');


const router = express.Router();

// Add a new theater
router.post('/', async (req, res) => {
  try {
    const {seatsPerRow, numberOfRows} = req.body
    const theater = new Theater({
      seatsCapacity: seatsPerRow * numberOfRows,
      ...req.body,
      showTimings: ['10:00', '14:00', '18:00'] // Fixed 3 shows every day
    });
    await theater.save();
    res.status(201).send(theater);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all theaters
router.get('/', async (req, res) => {
  try {
    const theaters = await Theater.find();
    res.send(theaters);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get theaters in a specific city
router.get('/city/:cityName', async (req, res) => {
  try {
    const cityName = req.params.cityName;
    const theaters = await Theater.find({ city: cityName });
    
    if (theaters.length === 0) {
      return res.status(404).send({ message: 'No theaters found in this city' });
    }
    
    res.send(theaters);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get a specific theater by ID
router.get('/:id', async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      return res.status(404).send({ message: 'Theater not found' });
    }
    res.send(theater);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a theater
router.patch('/:id', async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'address', 'seatsCapacity', 'numberOfRows', 'seatsPerRow'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    console.log(req.body);
    
    const theater = await Theater.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!theater) {
      return res.status(404).send();
    }
    res.send(theater);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a theater
// router.delete('/:id', async (req, res) => {
//   try {
//     const theater = await Theater.findByIdAndDelete(req.params.id);
//     if (!theater) {
//       return res.status(404).send();
//     }
//     res.send(theater);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });
// Update a theater
router.patch('/:id', async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'seatsCapacity', 'numberOfRows', 'seatsPerRow', 'address', 'city', 'showTimings'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      return res.status(404).send({ error: 'Theater not found' });
    }

    updates.forEach((update) => {
      if (update === 'showTimings') {
        theater[update] = JSON.parse(req.body[update].replace(/'/g, '"'));
      } else {
        theater[update] = req.body[update];
      }
    });

    await theater.save();
    res.send(theater);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a theater and its associated shows, bulk shows, and bookings
router.delete('/:theaterId', async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.theaterId);
    if (!theater) {
      return res.status(404).send({ error: 'Theater not found' });
    }

    // Delete associated shows and their bookings
    const shows = await Show.find({ theater: req.params.theaterId });
    for (const show of shows) {
      await Booking.deleteMany({ show: show._id });
    }
    const showDeletionResult = await Show.deleteMany({ theater: req.params.theaterId });

    // Update bulk shows to remove this theater
    const bulkShowUpdateResult = await BulkShow.updateMany(
      { theaters: req.params.theaterId },
      { $pull: { theaters: req.params.theaterId } }
    );

    // Delete the theater
    await Theater.findByIdAndDelete(req.params.theaterId);

    res.send({ 
      message: 'Theater and all associated data deleted successfully', 
      deletedTheater: theater,
      associatedDeletions: {
        shows: showDeletionResult.deletedCount
      },
      bulkShowsUpdated: bulkShowUpdateResult.nModified
    });
  } catch (error) {
    console.error('Error deleting theater:', error);
    res.status(500).send({ error: 'An error occurred while deleting the theater', details: error.message });
  }
});

module.exports = router;


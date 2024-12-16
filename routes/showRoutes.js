const express = require('express');
const Show = require('../models/Show');
const BulkShow = require('../models/BulkShow');
const Theater = require('../models/Theater');
const Movie = require('../models/Movie');
const Booking = require('../models/Booking');

const router = express.Router();



// Get all shows of a specified theater
router.get('/theater/:theaterId', async (req, res) => {
  try {
    const shows = await Show.find({ theater: req.params.theaterId })
      .populate('movie', 'title')
      .populate('theater', 'name')
      .sort({ date: 1, showTime: 1 });
    res.send(shows);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all bulk shows of a movie
router.get('/bulk/movie/:movieId', async (req, res) => {
  try {
    const bulkShows = await BulkShow.find({ movie: req.params.movieId })
      .populate('movie', 'title')
      .populate('theaters', 'name city');
    res.send(bulkShows);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get shows of a movie for a specific date and theater
router.get('/movie/:movieId/date/:date/theater/:theaterId', async (req, res) => {
  try {
    const { movieId, date, theaterId } = req.params;
    console.log(new Date(date), movieId, theaterId);
    
    const shows = await Show.find({
      movie: movieId,
      theater: theaterId,
      date: new Date(date)
    })
      .populate('movie', 'title')
      .populate('theater', 'name')
      .sort({ showTime: 1 });
    console.log(shows);
    
    res.send(shows);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Create a bulk show and generate individual shows
router.post('/bulk', async (req, res) => {
  try {
    const bulkShow = new BulkShow(req.body);
    await bulkShow.save();

    const individualShows = await createIndividualShows(bulkShow);

    res.status(201).send({ bulkShow, individualShowsCount: individualShows.length });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Create a new show (keep the existing functionality)
router.post('/', async (req, res) => {
  try {
    const { movieId, theaterId, showTime, date } = req.body;

    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return res.status(404).send({ error: 'Theater not found' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).send({ error: 'Movie not found' });
    }

    // Check if the show time is valid
    if (!theater.showTimings.includes(showTime)) {
      return res.status(400).send({ error: 'Invalid show time' });
    }

    // Check for conflicting shows
    const conflictingShow = await Show.findOne({
      theater: theaterId,
      date,
      showTime
    });

    if (conflictingShow) {
      return res.status(400).send({ error: 'Show time conflicts with an existing show' });
    }

    const show = new Show({
      movie: movieId,
      theater: theaterId,
      showTime,
      date,
      availableSeats: theater.seatsCapacity,
      bookedSeats: []
    });

    await show.save();
    res.status(201).send(show);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get details of all shows for a specific movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const shows = await Show.find({ movie: req.params.movieId })
      .populate('theater', 'name address')
      .populate('movie', 'title');
    res.send(shows);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get details of a specific show
router.get('/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('theater', 'name address seatsCapacity numberOfRows seatsPerRow')
      .populate('movie', 'title duration');
    if (!show) {
      return res.status(404).send();
    }
    res.send(show);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all bulk shows
router.get('/bulk', async (req, res) => {
  try {
    const bulkShows = await BulkShow.find()
      .populate('movie', 'title')
      .populate('theaters', 'name');
    res.send(bulkShows);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.get('/bulk/:bulkShowId', async (req, res) => {
  try {
    const bulkShows = await BulkShow.findById(req.params.bulkShowId)
      .populate('movie', 'title')
      .populate('theaters');
    res.send(bulkShows);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.get('/all/movie/:movieId', async (req, res) => {
  try {
    const shows = await BulkShow.find({ movie: req.params.movieId })
      .populate('theaters')
      .populate('movie', 'title');
    res.send(shows);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Helper function to create individual shows from a bulk show
async function createIndividualShows(bulkShow) {
  const { movie, theaters,seatPrice, startDate, endDate } = bulkShow;
  const movieObj = await Movie.findById(movie);
  const theaterObjs = await Theater.find({ _id: { $in: theaters } });

  let currentDate = new Date(startDate);
  const shows = [];

  while (currentDate <= new Date(endDate)) {
    for (const theater of theaterObjs) {
      for (const showTime of theater.showTimings) {
        const show = new Show({
          movie,
          theater: theater._id,
          seatPrice,
          showTime,
          date: new Date(currentDate),
          availableSeats: theater.seatsCapacity,
          bookedSeats: []
        });
        shows.push(show);
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return Show.insertMany(shows);
}
// Delete a bulk show and its associated individual shows
// Delete a bulk show and its associated individual shows
router.delete('/bulk/:bulkShowId', async (req, res) => {
  try {
    const bulkShow = await BulkShow.findById(req.params.bulkShowId);
    if (!bulkShow) {
      return res.status(404).send({ error: 'Bulk show not found' });
    }

    // Delete associated individual shows
    await Show.deleteMany({
      movie: bulkShow.movie,
      theater: { $in: bulkShow.theaters },
      date: { $gte: bulkShow.startDate, $lte: bulkShow.endDate }
    });

    // Delete the bulk show
    await BulkShow.findByIdAndDelete(req.params.bulkShowId);

    res.send({ message: 'Bulk show and associated individual shows deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete a show and its associated bookings
router.delete('/:showId', async (req, res) => {
  try {
    const show = await Show.findById(req.params.showId);
    if (!show) {
      return res.status(404).send({ error: 'Show not found' });
    }

    // Delete associated bookings
    const bookingDeletionResult = await Booking.deleteMany({ show: req.params.showId });

    // Delete the show
    await Show.findByIdAndDelete(req.params.showId);

    res.send({ 
      message: 'Show and all associated bookings deleted successfully', 
      deletedShow: show,
      associatedDeletions: {
        bookings: bookingDeletionResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting show:', error);
    res.status(500).send({ error: 'An error occurred while deleting the show', details: error.message });
  }
});
module.exports = router;


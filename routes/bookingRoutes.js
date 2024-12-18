const express = require('express');
const Booking = require('../models/Booking');
const Show = require('../models/Show');

const router = express.Router();

// Book seats for a show
router.post('/', async (req, res) => {
  try {
    const { showId, seats, name, email, phoneNumber, totalPrice } = req.body;
    console.log(showId, seats);
    
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).send({ error: 'Show not found' });
    }

    // Check if seats are available
    const unavailableSeats = seats.filter(seat => 
      show.bookedSeats.some(bookedSeat => 
        bookedSeat.row === seat.row && bookedSeat.seatNumber === seat.seatNumber
      )
    );

    if (unavailableSeats.length > 0) {
      return res.status(400).send({ error: 'Some seats are already booked', unavailableSeats });
    }

    // Create booking
    const booking = new Booking({
      show: showId,
      seats,
      totalPrice,// Assuming each seat costs $10
      name,
      email,
      phoneNumber
    });

    await booking.save();

    // Update show's booked seats and available seats
    show.bookedSeats.push(...seats);
    show.availableSeats -= seats.length;
    await show.save();

    res.status(201).send(booking);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all bookings with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const bookings = await Booking.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate({
        path: 'show',
        select: 'showTime date',
        populate: {
          path: 'movie theater',
          select: 'title name'
        }
      })
      .exec();

    const count = await Booking.countDocuments();

    res.send({
      bookings,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get bookings for a specific show
router.get('/show/:showId', async (req, res) => {
  try {
    const bookings = await Booking.find({ show: req.params.showId })
      .populate({
        path: 'show',
        select: 'showTime date',
        populate: {
          path: 'movie theater',
          select: 'title name'
        }
      });
    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.get('/:Id', async (req, res) => {
  try {
    const bookings = await Booking.findById(req.params.Id )
      .populate({
        path: 'show',
        select: 'showTime date',
        populate: [
          {
            path: 'movie',
            select: '' // This selects all fields for the movie
          },
          {
            path: 'theater',
            select: '' // This selects all fields for the theater
          }
        ]
      });
    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});


router.post('/booking/email', async (req, res) => {
  try {
    const { email } = req.body
    const bookings = await Booking.find({email: req.body.email} )
      .populate({
        path: 'show',
        select: 'showTime date',
        populate: {
          path: 'movie theater',
          select: 'title name city address'
        }
      });
    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});
// Get bookings for a specific theater
router.get('/theater/:theaterId', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: 'show',
        match: { theater: req.params.theaterId },
        select: 'showTime date',
        populate: {
          path: 'movie theater',
          select: 'title name'
        }
      })
      .then(bookings => bookings.filter(booking => booking.show)); // Filter out null shows

    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get bookings for a specific movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: 'show',
        match: { movie: req.params.movieId },
        select: 'showTime date',
        populate: {
          path: 'movie theater',
          select: 'title name'
        }
      })
      .then(bookings => bookings.filter(booking => booking.show)); // Filter out null shows

    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get bookings for a specific date range
router.get('/daterange', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).send({ error: 'Start date and end date are required' });
    }

    const bookings = await Booking.find()
      .populate({
        path: 'show',
        match: { 
          date: { 
            $gte: new Date(startDate), 
            $lte: new Date(endDate) 
          } 
        },
        select: 'showTime date',
        populate: {
          path: 'movie theater',
          select: 'title name'
        }
      })
      .then(bookings => bookings.filter(booking => booking.show)); // Filter out null shows

    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;


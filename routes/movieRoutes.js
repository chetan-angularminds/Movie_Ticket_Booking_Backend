const express = require("express");
const Movie = require("../models/Movie");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const Show = require('../models/Show');
const BulkShow = require('../models/BulkShow');
const Booking = require('../models/Booking'); // Added import for Booking model


// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../static/posters")); // Save in 'static/posters' directory
  },
  filename: (req, file, cb) => {
    // Generate filename: clean title by removing quotes and replacing spaces with underscores
    const movieName = req.body.title.replace(/['"\s]+/g, "_"); // Remove quotes and replace spaces with underscores
    cb(null, `${movieName}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Validate file type
    const fileTypes = /jpeg|jpg|png/;
    const extName = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed (jpeg, jpg, png)"));
  },
});

// Route to handle movie registration
router.post("/", upload.single("poster"), async (req, res) => {
  try {
    // Clean title, genre, and language fields
    const movieData = {
      title: req.body.title.replace(/['"]+/g, ""), // Remove extra quotes
      description: req.body.description.replace(/['"]+/g, ""), // Remove extra quotes
      duration: req.body.duration,
      releaseDate: req.body.releaseDate,
      genre: Array.isArray(req.body.genre)
        ? req.body.genre
        : JSON.parse(req.body.genre.replace(/'/g, '"')), // Convert to array
      language: Array.isArray(req.body.language)
        ? req.body.language
        : JSON.parse(req.body.language.replace(/'/g, '"')), // Convert to array
      poster: `https://movie-ticket-booking-backend-mjx1.onrender.com/static/posters/${req.file.filename}`, // Store the poster's URL
    };

    const movie = new Movie(movieData);
    await movie.save();

    res.status(201).send(movie);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get all movies with pagination, search, and sorting
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "title",
      sortOrder = "desc",
    } = req.query;
    
    console.log(limit);
    
    const query = search ? { title: new RegExp(search, "i") } : {};
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const movies = await Movie.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Movie.countDocuments(query);

    res.send({
      movies,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get details of a specific movie
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).send();
    }
    res.send(movie);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete a movie and its associated shows, bulk shows, and bookings
router.delete('/:movieId', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).send({ error: 'Movie not found' });
    }

    // Delete associated shows and their bookings
    const shows = await Show.find({ movie: req.params.movieId });
    for (const show of shows) {
      await Booking.deleteMany({ show: show._id });
    }
    const showDeletionResult = await Show.deleteMany({ movie: req.params.movieId });

    // Delete associated bulk shows
    const bulkShowDeletionResult = await BulkShow.deleteMany({ movie: req.params.movieId });

    // Delete the movie
    await Movie.findByIdAndDelete(req.params.movieId);

    res.send({ 
      message: 'Movie and all associated data deleted successfully', 
      deletedMovie: movie,
      associatedDeletions: {
        shows: showDeletionResult.deletedCount,
        bulkShows: bulkShowDeletionResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).send({ error: 'An error occurred while deleting the movie', details: error.message });
  }
});


// Update movie details
router.patch("/:movieId", upload.single("poster"), async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      "title",
      "description",
      "duration",
      "releaseDate",
      "genre",
      "language",
    ];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).send({ error: "Invalid updates!" });
    }

    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).send({ error: "Movie not found" });
    }

    updates.forEach((update) => {
      if (update === "genre" || update === "language") {
        movie[update] = JSON.parse(req.body[update].replace(/'/g, '"'));
      } else {
        movie[update] = req.body[update];
      }
    });

    if (req.file) {
      movie.poster = `https://movie-ticket-booking-backend-mjx1.onrender.com/static/posters/${req.file.filename}`;
    }

    await movie.save();
    res.send(movie);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;

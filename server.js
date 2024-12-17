require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const theaterRoutes = require('./routes/theaterRoutes');
const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const cityRoutes = require('./routes/cityRoutes');
const app = express();
const path = require('path');
const urlUpdater = require('./Image_URL_Updater');
mongoose.set('strictQuery', true);
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Allowed methods
}));

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {console.log('Connected to MongoDB')
  urlUpdater.update('https://movie-ticket-booking-backend-mjx1.onrender.com');
})
.catch((err) => console.error('Could not connect to MongoDB', err));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/api/theaters', theaterRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cities', cityRoutes);

const fs = require('fs');


app.get('/static/posters/list', (req, res) => {
  const directoryPath = path.join(__dirname, 'static', 'posters'); // Adjust the path as needed
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err.message);
      return res.status(500).send('Unable to scan directory');
    }
    // Send the list of file names as JSON
    res.json(files);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


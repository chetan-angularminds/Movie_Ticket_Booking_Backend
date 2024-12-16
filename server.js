require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const theaterRoutes = require('./routes/theaterRoutes');
const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const cityRoutes = require('./routes/cityRoutes')
const app = express();
const path = require('path');

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
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Could not connect to MongoDB', err));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/api/theaters', theaterRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cities', cityRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


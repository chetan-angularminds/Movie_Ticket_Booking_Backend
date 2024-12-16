const express = require('express');
const City = require('../models/City');


const router = express.Router();

// Get all cities
router.get('/', async (req, res) => {
  try {
    const cities = await City.find();
    res.send(cities);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Add a new city (admin only)
router.post('/', async (req, res) => {
  try {
    const city = new City(req.body);
    await city.save();
    res.status(201).send(city);
    console.log("citiy created");
    
  } catch (error) {
    res.status(400).send(error);
    console.log("error in city creation");
    
  }
});

module.exports = router;


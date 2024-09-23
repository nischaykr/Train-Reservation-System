const express = require('express');
const Seat = require('../model/seat.model.js');
const router = express.Router();

// to Initialize seats
// This function is called just once to initialize 80 the seats in the database
router.post('/initialize', async (req, res) => {
  const seats = [];
  for (let i = 1; i <= 80; i++) {
    seats.push({ seatNumber: i });
  }
  await Seat.insertMany(seats);
  res.send('Seats initialized');
});

// To get all the seats status.
router.get('/seats', async (req, res) => {
  try {
    // Retrieve all seats from the database, ordered by seat number
    const seats = await Seat.find().sort({ seatNumber: 1 });
    const seatStatuses = seats.map(seat => seat.isBooked ? 1 : 0);

    res.status(200).json(seatStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Book seats
router.post('/book', async (req, res) => {
  const { numOfSeats } = req.body;

  //Validation
  if (numOfSeats < 1 || numOfSeats > 7) {
    return res.status(400).json({ message: 'Invalid number of seats. You can book between 1 to 7 seats.' });
  }

  try {
    const seats = await Seat.find().sort({ seatNumber: 1 });

    // Group seats by rows according to the frontend layout
    const rows = [];
    for (let i = 0; i < 80; i += 7) {
      const leftSeats = seats.slice(i, i + 4);
      const rightSeats = seats.slice(i + 4, i + 7);
      rows.push([...leftSeats, ...rightSeats]);
    }

    // find a row for consecutive available seats
    let bookedSeats = [];
    for (const row of rows) {
      const availableSeatsInRow = row.filter(seat => !seat.isBooked);

      if (availableSeatsInRow.length >= numOfSeats) {
        bookedSeats = availableSeatsInRow.slice(0, numOfSeats).map(seat => seat.seatNumber);
        break;
      }
    }

    // If no single row had enough seats,so now booking nearby seats
    if (bookedSeats.length < numOfSeats) {
      const remainingSeats = numOfSeats - bookedSeats.length;

      const availableSeats = seats.filter(seat => !seat.isBooked && !bookedSeats.includes(seat.seatNumber));
      const additionalSeats = availableSeats.slice(0, remainingSeats).map(seat => seat.seatNumber);
      bookedSeats = [...bookedSeats, ...additionalSeats];
    }

    // If not enough seats are available
    if (bookedSeats.length < numOfSeats) {
      return res.status(400).json({ message: 'Not enough seats available.' });
    }

    await Seat.updateMany({ seatNumber: { $in: bookedSeats } }, { isBooked: true });

    res.status(200).json({ bookedSeats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Vacate all seats
router.post('/vacate', async (req, res) => {
  try {
    await Seat.updateMany({}, { isBooked: false });
    res.status(200).json({ message: 'All seats vacated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
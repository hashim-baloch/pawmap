const express = require('express');
const VolunteerResponse = require('../models/VolunteerResponse');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Middleware to authenticate user via JWT token
const authenticateUser = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Volunteer form submission
router.post(
  '/submit',
  authenticateUser,
  [
    body('question1').notEmpty().withMessage('Question 1 answer is required'),
    body('question2').notEmpty().withMessage('Question 2 answer is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question1, question2 } = req.body;

    try {
      const volunteerResponse = new VolunteerResponse({
        userId: req.user.userId,
        question1,
        question2
      });

      // Save the response to the database
      await volunteerResponse.save();

      res.status(201).json({ message: 'Form submitted successfully!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error submitting form', error: err });
    }
  }
);

// Get volunteer responses (admin access only)
router.get('/responses', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const responses = await VolunteerResponse.find().populate('userId');
    res.json(responses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching responses', error: err });
  }
});

module.exports = router;

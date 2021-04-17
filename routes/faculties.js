const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Faculty = require('../models/Faculty');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @route   GET    /api/faculties
// @desc    Get all faculties
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const faculties = await Faculty.find({})
      .select('-password')
      .sort({date: -1});
    res.json(faculties);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server error!');
  }
});

// @route   GET    /api/faculties
// @desc    Get single faculty
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id).select('-password');
    res.json(faculty);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server error!');
  }
});

// @route   POST    api/faculties
// @desc    Register a faculty
// @access  Public
router.post(
  '/',
  [
    check('name', 'Please add name').not().isEmpty(),
    check('username', 'Please add username')
      .not()
      .isEmpty()
      .custom(value => !/\s/.test(value))
      .withMessage('Username must not contain any spaces'),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({min: 6}),
  ],
  async (req, res) => {
    // check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({error: errors.array()});
    }

    const {name, username, password} = req.body;
    try {
      let faculty = await Faculty.findOne({username});
      if (faculty)
        return res
          .status(400)
          .json({msg: 'User already exists', id: 'USER_EXISTS'});

      // add fields
      faculty = new Faculty({
        name,
        username,
        password,
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      faculty.password = await bcrypt.hash(password, salt);

      // save
      await faculty.save();

      const payload = {
        isFaculty: true,
        faculty: {
          id: faculty.id,
        },
      };

      // Generate json web token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({token, ...payload});
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error!');
    }
  }
);

module.exports = router;

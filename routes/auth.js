const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// @route   GET    api/auth
// @desc    Get current logged in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.isStudent) {
      const student = await Student.findById(req.user.student.id).select(
        '-password'
      );
      res.json({student, isStudent: true, isFaculty: false});
    }
    if (req.user.isFaculty) {
      const faculty = await Faculty.findById(req.user.faculty.id).select(
        '-password'
      );
      res.json({faculty, isFaculty: true, isStudent: false});
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error!');
  }
});

// @route   POST    api/auth
// @desc    login user & get token
// @access  Public
router.post(
  '/',
  [
    check('username', 'Please add username').exists().not().isEmpty(),
    check('password', 'Password is required').exists().not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

    const {username, password} = req.body;

    try {
      const student = await Student.findOne({username});
      const faculty = await Faculty.findOne({username});
      if (!student && !faculty)
        return res
          .status(400)
          .json({msg: 'Invalid credentials', id: 'INVALID_CREDENTIALS'});

      let payload = {};

      if (student) {
        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch)
          return res
            .status(400)
            .json({msg: 'Invalid password', id: 'INVALID_PASSWORD'});
        payload = {
          isStudent: true,
          student: {
            id: student.id,
          },
        };
      }
      if (faculty) {
        const isMatch = await bcrypt.compare(password, faculty.password);
        if (!isMatch)
          return res
            .status(400)
            .json({msg: 'Invalid password', id: 'INVALID_PASSWORD'});

        payload = {
          isFaculty: true,
          faculty: {
            id: faculty.id,
          },
        };
      }

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {expiresIn: 360000},
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

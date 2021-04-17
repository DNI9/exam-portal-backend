const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Test = require('../models/Test');
const authMiddleware = require('../middleware/auth');

// @route   GET    /api/faculties
// @desc    Get all faculties
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const student = await Student.find({}).select('-password').sort({date: -1});
    res.json(student);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server error!');
  }
});

// @route   GET    /api/faculties
// @desc    Get single student
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    res.json(student);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server error!');
  }
});

// @route   POST    api/students
// @desc    Register a student
// @access  Public
router.post(
  '/',
  [
    check('username', 'Please add username')
      .not()
      .isEmpty()
      .custom(value => !/\s/.test(value))
      .withMessage('Username must not contain any spaces'),
    check('name', 'Please add name').not().isEmpty(),
    check('batchName', 'Please add batch name').not().isEmpty(),
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

    const {name, username, password, batchName} = req.body;
    try {
      let batch = await Batch.findOne({name: batchName});
      let student = await Student.findOne({username});
      if (student)
        return res
          .status(400)
          .json({msg: 'User already exists', id: 'USER_EXISTS'});

      if (!batch) return res.status(400).json({msg: 'Batch does not exists'});

      // add fields
      student = new Student({
        name,
        username,
        password,
        batch_id: batch._id,
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      student.password = await bcrypt.hash(password, salt);

      // save
      const newStudent = await student.save();

      // also add this student to specified batch
      if (batch) {
        await Batch.findByIdAndUpdate(batch._id, {
          $push: {student_list: newStudent._id},
        });
      }

      const payload = {
        isStudent: true,
        student: {
          id: student.id,
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

// @route   PUT    /api/students/score
// @desc    add score to a student
// @access  private
router.put(
  '/score/:id',
  [
    authMiddleware,
    [
      check('test_id', 'test_id is required').not().isEmpty(),
      check('score', 'score is required').exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});
    if (req.user.isStudent)
      return res.status(401).json({msg: 'Unauthorized action'});

    try {
      const {test_id, score} = req.body;

      let test = await Test.findById(test_id);
      if (!test) return res.status(404).json({msg: 'Test not found'});

      let scoreAddedAlready;
      await Student.findById(req.params.id, (err, doc) => {
        if (err) throw err;
        scoreAddedAlready = doc.scores.find(
          score => score.test_id.toString() === test_id
        );
      });
      if (scoreAddedAlready)
        return res.status(400).json({msg: 'Score already added for this test'});

      const student = await Student.findByIdAndUpdate(
        req.params.id,
        {$push: {scores: {test_id, score}}},
        {new: true}
      );
      res.json(student);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error!');
    }
  }
);

module.exports = router;

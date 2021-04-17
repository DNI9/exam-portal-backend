const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Test = require('../models/Test');
const Batch = require('../models/Batch');

// @route   GET    /api/tests
// @desc    Get test list
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    let tests;
    if (req.user.isStudent) {
      if (req.query.batch_id === undefined || req.query.batch_id === '')
        return res.status(400).json({msg: 'Batch id is required'});

      tests = await Test.find({batch_id: req.query.batch_id})
        .select('-answers')
        .sort({createdAt: -1});
    } else {
      tests = await Test.find({}).sort({createdAt: -1});
    }
    res.json(tests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error!');
  }
});

// @route   POST    /api/tests
// @desc    add a new test
// @access  Private
router.post(
  '/',
  [
    authMiddleware,
    [
      check('faculty_id', 'faculty_id is required').not().isEmpty(),
      check('batch_id', 'batch_id is required').not().isEmpty(),
      check('test_details', 'Test details are required').exists({
        checkNull: true,
      }),
      check('questions', 'Questions are required')
        .exists()
        .not()
        .isEmpty()
        .isArray(),
      check('answers', 'Answers are required')
        .exists()
        .not()
        .isEmpty()
        .isArray(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

    if (req.user.isStudent)
      return res.status(401).json({msg: 'Unauthorized action'});

    try {
      let batch = await Batch.findById(req.body.batch_id);
      if (!batch) return res.status(404).json({msg: 'Batch not found'});

      const {
        faculty_id,
        batch_id,
        test_details: {
          name,
          marks,
          subject,
          testTimeHours,
          testTimeMinutes,
          testDate,
          testStartTime,
          testEndTime,
        },
        questions,
        answers,
      } = req.body;

      const newTest = new Test({
        faculty_id,
        batch_id,
        test_details: {
          name,
          marks,
          subject,
          testTimeHours,
          testTimeMinutes,
          testDate,
          testStartTime,
          testEndTime,
        },
        questions,
        answers,
      });

      const test = await newTest.save();
      res.json(test);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error!');
    }
  }
);

// @route   PUT    /api/tests
// @desc    update/edit a test
// @access  Private
router.put(
  '/:id',
  [
    authMiddleware,
    [
      check('faculty_id', 'faculty_id is required').not().isEmpty(),
      check('batch_id', 'batch_id is required').not().isEmpty(),
      check('test_details', 'Test details are required').exists({
        checkNull: true,
      }),
      check('questions', 'Questions are required').exists(),
      check('answers', 'Answers are required').exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

    if (req.user.isStudent)
      return res.status(401).json({msg: 'Unauthorized action'});

    try {
      let test = await Test.findById(req.params.id);
      if (!test) return res.status(404).json({msg: 'Test not found'});

      const {
        faculty_id,
        batch_id,
        test_details: {
          name,
          marks,
          subject,
          testTimeHours,
          testTimeMinutes,
          testDate,
          testStartTime,
          testEndTime,
        },
        questions,
        answers,
      } = req.body;

      const updatedTest = {
        faculty_id,
        batch_id,
        test_details: {
          name,
          marks,
          subject,
          testTimeHours,
          testTimeMinutes,
          testDate,
          testStartTime,
          testEndTime,
        },
        questions,
        answers,
      };

      test = await Test.findByIdAndUpdate(
        req.params.id,
        {$set: updatedTest},
        {new: true}
      );
      res.json(test);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error!');
    }
  }
);

// @route   DELETE    /api/tests
// @desc    delete a test
// @access  Private
router.delete(
  '/:id',
  [
    authMiddleware,
    // check('faculty_id', 'faculty_id is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

    if (req.user.isStudent)
      return res.status(401).json({msg: 'Unauthorized action'});

    try {
      const test = await Test.findById(req.params.id);
      if (!test) return res.status(400).json({msg: 'Test not found'});

      // if (test.faculty_id.toString() !== req.body.faculty_id)
      //   return res
      //     .status(401)
      //     .json({msg: "Test can't be removed by this faculty"});

      await Test.findByIdAndRemove(req.params.id);
      res.json({msg: `Removed ${test.test_details.name}`});
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST    /api/tests/
// @desc    confirm test
// @access  Private
router.post(
  '/:id',
  [
    authMiddleware,
    check('faculty_id', 'faculty_id is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

    if (req.user.isStudent)
      return res.status(401).json({msg: 'Unauthorized action'});

    try {
      const test = await Test.findById(req.params.id);
      if (!test) return res.status(400).json({msg: 'Test not found'});

      if (test.faculty_id.toString() !== req.body.faculty_id)
        return res
          .status(401)
          .json({msg: "Test can't be confirmed by this faculty"});

      await Test.findByIdAndUpdate(req.params.id, {$set: {isConfirmed: true}});
      res.json({msg: 'Test confirmed, now students can see the test'});
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST    /api/tests/dismiss
// @desc    dismiss/terminate a test
// @access  Private
router.post(
  '/dismiss/:id',
  [
    authMiddleware,
    check('faculty_id', 'faculty_id is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

    if (req.user.isStudent)
      return res.status(401).json({msg: 'Unauthorized action'});

    try {
      const test = await Test.findById(req.params.id);
      if (!test) return res.status(400).json({msg: 'Test not found'});

      if (test.faculty_id.toString() !== req.body.faculty_id)
        return res
          .status(401)
          .json({msg: "Test can't be dismissed by this faculty"});

      await Test.findByIdAndUpdate(req.params.id, {$set: {isCompleted: true}});
      res.json({msg: 'Test dismissed'});
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);
module.exports = router;

const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Submission = require('../models/Submission');
const Test = require('../models/Test');
const Student = require('../models/Student');

// @route   GET    /api/submissions
// @desc    Get submission list
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const submissions = await Submission.find({}).sort({createdAt: -1});
    res.json(submissions);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server error!');
  }
});

// @route   POST    /api/submissions
// @desc    add new submission
// @access  private
router.post(
  '/',
  [
    authMiddleware,
    [
      check('test_id', 'test_id is required').not().isEmpty(),
      check('student_id', 'student_id is required').not().isEmpty(),
      check('faculty_id', 'faculty_id is required').not().isEmpty(),
      check('submitted_ans', 'submitted_ans is required')
        .not()
        .isEmpty()
        .isArray(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

    if (req.user.isFaculty)
      return res.status(401).json({msg: 'Faculty can not add a submission'});

    try {
      const {test_id, student_id, faculty_id, submitted_ans} = req.body;

      const test = await Test.findById(test_id);
      if (!test) return res.status(404).json({msg: 'Test not found'});

      const testFound = await Submission.findOne({test_id});
      const studentFound = await Submission.findOne({student_id});
      if (testFound && studentFound)
        return res.status(400).json({
          msg: 'This student already submitted the test',
        });

      const newSubmission = new Submission({
        test_id,
        student_id,
        faculty_id,
        submitted_ans,
      });
      const submission = await newSubmission.save();
      // Add student id in Test's submitted_by array to later determine who submitted the test
      await Test.findByIdAndUpdate(test_id, {
        $push: {submitted_by: student_id},
      });
      res.json(submission);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error!');
    }
  }
);

// @route   POST    /api/submissions
// @desc    Evaluate a submission
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
      const submission = await Submission.findById(req.params.id);
      if (!submission)
        return res.status(400).json({msg: 'Submission not found'});

      if (submission.faculty_id.toString() !== req.body.faculty_id)
        return res
          .status(401)
          .json({msg: "Submission can't be evaluated by this faculty"});

      await Submission.findByIdAndUpdate(req.params.id, {
        $set: {isEvaluated: true},
      });
      res.json({msg: 'Submission evaluated'});
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;

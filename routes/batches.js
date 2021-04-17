const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Batch = require('../models/Batch');
const Faculty = require('../models/Faculty');

// @route   GET    /api/batches
// @desc    Get all batches
// @access  Public
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find({}).sort({date: -1});
    res.json(batches);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server error!');
  }
});

// @route   GET    /api/batches
// @desc    Get single batch
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    res.json(batch);
  } catch (err) {
    console.error(err.message);
    req.status(500).send('Server error!');
  }
});

// @route   POST    /api/batches
// @desc    add new batch
// @access  private
router.post(
  '/',
  [authMiddleware, [check('name', 'Batch name is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

    if (req.user.isStudent)
      return res.status(401).json({msg: 'Unauthorized action'});

    try {
      let batch = await Batch.findOne({name: req.body.name});
      if (batch) return res.status(400).json({msg: 'Batch already exists'});

      const newBatch = new Batch({
        name: req.body.name,
      });
      batch = await newBatch.save();
      res.json(batch);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error!');
    }
  }
);

// @route   PUT    /api/batches
// @desc    update batch
// @access  private
router.put(
  '/:id',
  [authMiddleware, [check('name', 'Batch name is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});
    if (req.user.isStudent)
      return res.status(401).json({msg: 'Unauthorized action'});

    try {
      let batch = await Batch.findById(req.params.id);
      if (!batch) return res.status(404).json({msg: 'Batch not found'});

      batch = await Batch.findByIdAndUpdate(
        req.params.id,
        {$set: {name: req.body.name}},
        {new: true}
      );
      res.json(batch);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error!');
    }
  }
);

// @route   DELETE    /api/batches
// @desc    delete batch
// @access  private
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.isStudent)
    return res.status(401).json({msg: 'Unauthorized action'});
  try {
    let batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(400).json({msg: 'Batch not found'});

    await Batch.findByIdAndRemove(req.params.id);
    res.json({msg: 'Batch removed'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST    /api/batches/faculty
// @desc    assign a faculty to a batch & a batch to a faculty
// @access  private
router.post(
  '/faculty/:id',
  [authMiddleware, check('name', 'Batch name is required').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

    if (req.user.isStudent)
      return res.status(401).json({msg: 'Unauthorized action'});

    // get the batch name
    const {name} = req.body;

    try {
      let batch = await Batch.findOne({name});
      if (!batch) return res.status(404).json({msg: 'Batch not found'});

      let found = batch.faculties.find(
        facultyID => facultyID.toString() === req.params.id
      );
      if (found)
        return res
          .status(400)
          .json({msg: 'Faculty already exists in this batch'});

      let faculty = await Faculty.findById(req.params.id);
      if (!faculty) return res.status(404).json({msg: 'Faculty not found'});

      found = faculty.assigned_batches.find(
        batchID => batchID.toString() === batch._id
      );
      if (found)
        return res
          .status(400)
          .json({msg: 'Batch already assigned to this faculty'});

      await Batch.findByIdAndUpdate(batch._id, {
        $push: {faculties: faculty._id},
      });

      // also add this batch to faculty's batch list
      await Faculty.findByIdAndUpdate(faculty._id, {
        $push: {assigned_batches: batch._id},
      });

      res.json({
        msg: `Added faculty to batch ${name} & updated faculty's batch list`,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error!');
    }
  }
);

// @route   DELETE    /api/batches/faculty
// @desc    remove a faculty from a batch & batch from faculty's list
// @access  private

router.delete(
  '/faculty/:id',
  [authMiddleware, check('name', 'Batch name is required').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: errors.array()});

    if (req.user.isStudent)
      return res.status(401).json({msg: 'Unauthorized action'});

    // get the batch name
    const {name} = req.body;
    try {
      let batch = await Batch.findOne({name});
      if (!batch) return res.status(404).json({msg: 'Batch not found'});

      let found = batch.faculties.find(
        facultyID => facultyID.toString() === req.params.id
      );
      if (!found)
        return res
          .status(404)
          .json({msg: "Faculty doesn't exists in this batch list"});

      let faculty = await Faculty.findById(req.params.id);
      if (!faculty) return res.status(404).json({msg: 'Faculty not found'});

      found = faculty.assigned_batches.find(
        batchID => batchID.toString() === batch._id.toString()
      );
      if (!found)
        return res
          .status(404)
          .json({msg: "Batch doesn't exists in this faculty's list"});

      await Batch.findByIdAndUpdate(batch._id, {
        $pull: {faculties: req.params.id},
      });

      // also remove the batch from faculty's batch list
      await Faculty.findByIdAndUpdate(faculty._id, {
        $pull: {assigned_batches: batch._id},
      });

      res.json({
        msg: `Removed faculty from the batch's faculty list and this batch from faculty's batch list`,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error!');
    }
  }
);

module.exports = router;

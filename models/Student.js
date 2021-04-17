const mongoose = require('mongoose');

const StudentSchema = mongoose.Schema({
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'batches',
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  assigned_tests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tests',
    },
  ],
  scores: [
    {
      test_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tests',
      },
      score: {
        type: Number,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('student', StudentSchema);

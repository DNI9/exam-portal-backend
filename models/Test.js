const mongoose = require('mongoose');

const TestSchema = mongoose.Schema(
  {
    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'faculties',
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'batches',
    },
    submitted_by: [{type: mongoose.Schema.Types.ObjectId, ref: 'tests'}],
    test_details: {
      name: {
        type: String,
        required: true,
      },
      marks: {
        type: Number,
        required: true,
      },
      subject: {
        type: String,
        required: true,
      },
      testTimeHours: Number,
      testTimeMinutes: Number,
      testDate: Date,
      testStartTime: Date,
      testEndTime: Date,
    },
    // if this is true, then students can see the test
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    // for dismissing the test
    isCompleted: {
      type: Boolean,
      default: false,
    },

    questions: [
      {
        qsn_no: {
          type: Number,
          required: true,
        },
        question: {
          type: String,
          required: true,
        },
        options: {
          type: Map,
          of: String,
          required: true,
        },
      },
    ],
    answers: [
      {
        qsn_no: {
          type: Number,
          required: true,
        },
        ans: {
          type: Number,
          min: 1,
          max: 4,
          required: true,
        },
      },
    ],
  },
  {timestamps: true}
);

module.exports = mongoose.model('test', TestSchema);

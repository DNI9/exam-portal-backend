const mongoose = require('mongoose');

const SubmissionSchema = mongoose.Schema(
  {
    test_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tests',
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'students',
    },
    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'faculties',
    },
    isEvaluated: {
      type: Boolean,
      default: false,
    },
    submitted_ans: [
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

module.exports = mongoose.model('submission', SubmissionSchema);

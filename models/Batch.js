const mongoose = require('mongoose');

const BatchSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  student_list: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'students',
    },
  ],
  faculties: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'faculties',
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('batch', BatchSchema);

const mongoose = require('mongoose');

const FacultySchema = mongoose.Schema({
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
    date: {
        type: Date,
        default: Date.now,
    },
    assigned_batches: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'batches',
        },
    ],
});

module.exports = mongoose.model('faculty', FacultySchema);

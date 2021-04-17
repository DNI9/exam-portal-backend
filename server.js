require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({extended: false}));

// DEFINE ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/faculties', require('./routes/faculties'));
app.use('/api/students', require('./routes/students'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/tests', require('./routes/tests'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`-------------------------\nServer started at ${PORT}`)
);

const mongoose = require('mongoose');

const connectDB = (mongoUri) => mongoose.connect(mongoUri);

module.exports = connectDB;

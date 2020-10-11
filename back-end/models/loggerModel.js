const mongoose = require('mongoose');

const loggerSchema = new mongoose.Schema({
    userID: { type: String },
    action: { type: String },
    date: { type: Date }
});

module.exports = Logger = mongoose.model('logger', loggerSchema);
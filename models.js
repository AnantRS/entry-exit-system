const mongoose = require('mongoose');

const peopleSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  entrygate: String,
});

const entrySchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  date: Date,
  entrygate: String,
});

const exitSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  date: Date,
  exitgate: String,
});

const historySchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  numberOfEntry: Number,
  numberOfExit: Number,
});

const People = mongoose.model('People', peopleSchema);
const Entry = mongoose.model('Entry', entrySchema);
const Exit = mongoose.model('Exit', exitSchema);
const History = mongoose.model('History', historySchema);

module.exports = { People, Entry, Exit, History };

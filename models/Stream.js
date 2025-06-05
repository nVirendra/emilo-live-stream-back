const mongoose = require('mongoose');

const StreamSchema = new mongoose.Schema({
  title: String,
  description: String,
  streamKey: String,
  hlsUrl: String,
  isLive: { type: Boolean, default: false },
});

module.exports = mongoose.model('Stream', StreamSchema);

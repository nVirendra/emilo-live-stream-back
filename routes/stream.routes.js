const express = require('express');
const router = express.Router();
const Stream = require('../models/Stream');

router.post('/create', async (req, res) => {
  const { title, description,isLive } = req.body;
  const streamKey = Math.random().toString(36).substring(7);
  const stream = new Stream({
    title,
    description,
    isLive,
    streamKey,
    hlsUrl: `/live/${streamKey}/index.m3u8`,
  });
  await stream.save();
  res.json(stream);
});

router.get('/live', async (req, res) => {
  const liveStreams = await Stream.find({ isLive: true });
  res.json(liveStreams);
});

module.exports = router;

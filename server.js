const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./app');
const NodeMediaServer = require('node-media-server');
const mongoose = require('mongoose');
const ffmpegPath = require('ffmpeg-static');

require('dotenv').config();


const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: '*' },
// });
const io = new Server(server, {
  cors: { origin: '*' },
  pingInterval: 10000,
  pingTimeout: 5000,
  allowEIO3: true,
  transports: ['websocket'],
});




// MongoDB connection
mongoose.connect(process.env.MONGO_URI);

// Start HTTP server
server.listen(5000, () => console.log('Server running on http://localhost:5000'));

// NodeMediaServer config
const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: './media',
  },
  trans: {
    ffmpeg: ffmpegPath, // use same ffmpeg-static path
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        dash: false,
      },
    ],
  },
};

const nms = new NodeMediaServer(nmsConfig);

app.use('/hls', express.static(path.join(__dirname, 'media/live')));


nms.run();

nms.on('postPublish', (id, streamPath, args) => {
  console.log(`[NodeEvent on postPublish] Stream started: ${streamPath}`);
});

nms.on('donePublish', (id, streamPath, args) => {
  console.log(`[NodeEvent on donePublish] Stream ended: ${streamPath}`);
});

require('./socket/stream.socket')(io);

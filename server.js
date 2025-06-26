const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./app');
const NodeMediaServer = require('node-media-server');
const connectDB = require('./config/database');
const nmsConfig = require('./config/nms.config');

require('dotenv').config();


const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingInterval: 10000,
  pingTimeout: 5000,
  allowEIO3: true,
  transports: ['websocket'],
});




// Connect to MongoDB first
connectDB()
  .then(() => {
    // Serve static HLS files
    app.use('/hls', express.static(path.join(__dirname, 'media/live')));

    // Start HTTP server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

    // Start NodeMediaServer
    const nms = new NodeMediaServer(nmsConfig);
    nms.run();

    // Log stream events
    nms.on('postPublish', (id, streamPath) => {
      console.log(`[Stream started] ${streamPath}`);
    });

    nms.on('donePublish', (id, streamPath) => {
      console.log(`[Stream ended] ${streamPath}`);
    });

    // Initialize WebSocket
    require('./socket/stream.socket')(io);
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB. Server not started.', err);
  });

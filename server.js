const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./app');
const NodeMediaServer = require('node-media-server');

const ffmpegPath = require('ffmpeg-static');

const connectDB = require('./config/database');

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
connectDB();

const PORT = process.env.PORT;
// Start HTTP server
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));



app.use('/hls', express.static(path.join(__dirname, 'media/live')));



require('./socket/stream.socket')(io);

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');

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

    // Start HTTP server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  
    // Initialize WebSocket
    require('./socket/stream.socket')(io);
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB. Server not started.', err);
  });

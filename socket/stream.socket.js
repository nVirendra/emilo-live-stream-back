const { PassThrough } = require('stream');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const activeFFmpegStreams = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    socket.on('stream-chunk', ({ streamKey, chunk }) => {
      if (!streamKey || !chunk) {
        console.warn('⚠️ Missing streamKey or chunk');
        return;
      }

      const bufferChunk = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(new Uint8Array(chunk));

      let ffmpegStream = activeFFmpegStreams.get(streamKey);

      if (!ffmpegStream) {
        console.log(`🎬 Starting FFmpeg for streamKey: ${streamKey}`);
        const inputStream = new PassThrough();

        const outputDir = path.join(__dirname, '..', 'media', 'live', streamKey);
        fs.mkdirSync(outputDir, { recursive: true });

        const ffmpegArgs = [
          '-fflags', '+nobuffer',
          '-f', 'webm',
          '-i', 'pipe:0',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-b:v', '800k',
          '-maxrate', '800k',
          '-bufsize', '1200k',
          '-g', '50',
          '-keyint_min', '50',
          '-sc_threshold', '0',
          '-f', 'hls',
          '-hls_time', '2',
          '-hls_list_size', '3',
          '-hls_flags', 'delete_segments+omit_endlist',
          path.join(outputDir, 'index.m3u8')
        ];

        const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, {
          stdio: ['pipe', 'inherit', 'pipe'] // Input, stdout, stderr
        });

        ffmpegProcess.stderr.on('data', (data) => {
          console.log(`📺 FFmpeg stderr (${streamKey}): ${data.toString()}`);
        });

        ffmpegProcess.on('error', (err) => {
          console.error(`❌ FFmpeg error for ${streamKey}:`, err.message);
          inputStream.end();
          activeFFmpegStreams.delete(streamKey);
        });

        ffmpegProcess.on('exit', (code, signal) => {
          console.log(`🛑 FFmpeg process exited for ${streamKey} with code ${code}, signal ${signal}`);
          inputStream.end();
          activeFFmpegStreams.delete(streamKey);
        });

        inputStream.pipe(ffmpegProcess.stdin);
        activeFFmpegStreams.set(streamKey, inputStream);
        ffmpegStream = inputStream;
      }

      try {
        ffmpegStream.write(bufferChunk);
      } catch (err) {
        console.error(`❌ Error writing to FFmpeg stream:`, err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❎ Socket disconnected: ${socket.id}`);
    });
  });
};

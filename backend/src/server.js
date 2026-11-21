require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Start HTTP Server
  server.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🌾 Chakki Smart AI Backend Server running on port ${PORT}`);
    console.log(`🚀 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📖 Swagger Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
    console.log('====================================================');
  });
};

startServer();

// Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectDB();
    console.log('✅ Server & Database closed cleanly. Exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Uncaught exceptions & rejections handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

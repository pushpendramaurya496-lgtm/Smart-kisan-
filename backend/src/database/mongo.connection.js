const mongoose = require('mongoose');

/**
 * MongoDB Connection Manager with Mongoose
 * Handles initial connection, auto-reconnect, connection events & graceful shutdown.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chakki_smart_ai';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
      autoIndex: process.env.NODE_ENV !== 'production', // Build indexes in development
    });

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️ Tip: Ensure MongoDB service is running or check your MONGO_URI in .env');
    // In production we might exit, but in development allow server to continue or retry
    return null;
  }
};

// Mongoose Connection Event Listeners
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to DB successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose disconnected from DB');
});

// Graceful cleanup on server shutdown
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed cleanly');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};

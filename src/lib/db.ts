import mongoose from 'mongoose';

declare global {
  var mongoose: any;
}

// Check for required environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const isBuildProcess = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

if (!MONGODB_URI && !isBuildProcess) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, isConnecting: false };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options = {
      bufferCommands: true,
    };

    // Ensure all models are registered by importing them
    // The import is not used directly, but it ensures the models are registered
    await import('./models');
    
    // Skip actual connection during build process to avoid connection errors
    if (isBuildProcess) {
      console.log('Build process detected, skipping actual MongoDB connection');
      cached.promise = Promise.resolve(mongoose);
    } else {
      cached.promise = mongoose.connect(MONGODB_URI!, options)
        .then((mongoose) => {
          console.log('Connected to MongoDB');
          return mongoose;
        })
        .catch((err) => {
          console.error('MongoDB connection error:', err);
          throw err;
        });
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;

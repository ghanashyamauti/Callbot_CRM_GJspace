// MongoDB connection singleton — caches the connection so Next.js hot reloads
// don't spawn a new connection on every request.

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined. Add it to .env.local');
}

// In development, store connection in global to prevent multiple connections
// during hot reload. In production the module cache handles this.
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        dbName: 'callbot-crm',
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

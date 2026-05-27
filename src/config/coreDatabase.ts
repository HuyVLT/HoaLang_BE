import mongoose, { Connection } from 'mongoose';

const CORE_DB_URI =
  process.env.CORE_MONGODB_URI ||
  `mongodb://localhost:27017/hoalang_core`;

let coreConnection: Connection | null = null;

/**
 * Connect to the shared core database (hoalang_core).
 * Stores and reuses a single connection instance.
 */
export const connectCoreDB = async (): Promise<Connection> => {
  if (coreConnection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(CORE_DB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 30_000,
      serverSelectionTimeoutMS: 5_000,
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    console.log(`[CoreDB] Connected to hoalang_core`);
    coreConnection = mongoose.connection;
    return mongoose.connection;
  } catch (error) {
    console.error('[CoreDB] Failed to connect to hoalang_core:', error);
    throw error;
  }
};

/**
 * Return the cached core database connection.
 * Throws if the connection was never established.
 */
export const getCoreConnection = (): Connection => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('[CoreDB] Core database not connected. Call connectCoreDB() first.');
  }
  return mongoose.connection;
};

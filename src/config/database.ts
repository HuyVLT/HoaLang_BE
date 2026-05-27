import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hoalang';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed, retrying in 5 seconds...', error);
    setTimeout(() => {
      connectDB().catch((err) => console.error('Retry failed:', err));
    }, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected! Attempting reconnect...');
  connectDB().catch((err) => console.error('Reconnection handler failed:', err));
});

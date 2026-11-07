import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env['MONGODB_URI'];
  if (!uri) throw new Error('MONGODB_URI is required');

  mongoose.connection.on('connected', () => console.log('[boost-backend] MongoDB connected'));
  mongoose.connection.on('error', (err: Error) => console.error('[boost-backend] MongoDB error:', err));

  await mongoose.connect(uri, { dbName: 'boost_store' });
}

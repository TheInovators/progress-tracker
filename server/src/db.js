import mongoose from 'mongoose';

// With no MONGO_URI the server boots a throwaway in-memory MongoDB. That keeps a
// fresh clone runnable without installing a database, and production simply sets
// the variable.
export async function connectDb() {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri();
    console.log('MONGO_URI not set, started an in-memory MongoDB for this session');
  }

  await mongoose.connect(uri, { dbName: 'progress_tracker' });
  console.log('MongoDB connected');
  return mongoose.connection;
}

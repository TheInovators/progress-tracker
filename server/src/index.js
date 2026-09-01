import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server as SocketServer } from 'socket.io';

import { connectDb } from './db.js';
import User from './models/User.js';
import Message from './models/Message.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import leaderboardRoutes from './routes/leaderboard.js';
import contestRoutes from './routes/contests.js';
import executeRoutes from './routes/execute.js';
import chatRoutes from './routes/chat.js';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set, falling back to a development secret');
  process.env.JWT_SECRET = 'dev-only-secret';
}

const app = express();
const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin }));
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/chat', chatRoutes);

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }));

// Express 5 forwards rejected promises from async handlers, so anything a route
// throws lands here as a 500 with its message preserved.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin } });

// The chat socket carries the same JWT as the REST API, so an unauthenticated
// browser cannot open a connection and listen in.
io.use(async (socket, next) => {
  try {
    const payload = jwt.verify(socket.handshake.auth?.token || '', process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return next(new Error('Account no longer exists'));
    socket.data.user = { id: String(user._id), name: user.name };
    next();
  } catch {
    next(new Error('Authentication required'));
  }
});

io.on('connection', (socket) => {
  const room = 'general';
  socket.join(room);
  io.to(room).emit('presence', io.sockets.adapter.rooms.get(room)?.size ?? 0);

  socket.on('message', async (text) => {
    const body = String(text || '').trim().slice(0, 2000);
    if (!body) return;
    const saved = await Message.create({
      author: socket.data.user.id,
      authorName: socket.data.user.name,
      room,
      text: body,
    });
    io.to(room).emit('message', saved);
  });

  socket.on('disconnect', () => {
    io.to(room).emit('presence', io.sockets.adapter.rooms.get(room)?.size ?? 0);
  });
});

const port = Number(process.env.PORT || 5001);
await connectDb();
server.listen(port, () => console.log(`Progress Tracker API listening on http://localhost:${port}`));

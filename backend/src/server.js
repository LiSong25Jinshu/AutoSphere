import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { connectDB } from './config/database.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import passport from './config/passport.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import vehicleRoutes from './routes/vehicles.js';
import bookingRoutes from './routes/bookings.js';
import messageRoutes from './routes/messages.js';
import savedSearchesRoutes from './routes/savedSearches.js';

import { initializeMessageSocket } from './sockets/messageSocket.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL || 'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-test-mode'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/', rateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/saved-searches', savedSearchesRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

initializeMessageSocket(io);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
}

startServer();

export { app, io };

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/database.js';
import { syncDatabase } from './models/index.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import passport from './config/passport.js';
import { initializeMessageSocket } from './sockets/messageSocket.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import vehicleRoutes from './routes/vehicles.js';
import bookingRoutes, { setIo as setBookingsIo } from './routes/bookings.js';
import messageRoutes from './routes/messages.js';
import recommendationsRoutes from './routes/recommendations.js';
import servicesRoutes from './routes/services.js';
import savedSearchesRoutes from './routes/savedSearches.js';
import contactRoutes from './routes/contact.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import pushRoutes from './routes/push.js';
import gdprRoutes from './routes/gdpr.js';
import rentalRoutes from './routes/rentals.js';

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_PATH || 'uploads/vehicles';
// Serve uploaded files — works for both /uploads/vehicles/... paths
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

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
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/saved-searches', savedSearchesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/rentals', rentalRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

initializeMessageSocket(io);
setBookingsIo(io);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  // All non-API routes return the React app (client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

async function startServer() {
  try {
    await connectDB();
    // Sync new models (creates missing tables in development)
    await syncDatabase();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Retrying in 2 seconds...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT);
        }, 2000);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
}

startServer();

export { app, io };
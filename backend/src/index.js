import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { initDefaultManager } from './utils/initManager.js';
import authRoutes from './routes/auth.js';
import qrRoutes from './routes/qr.js';
import attendanceRoutes from './routes/attendance.js';
import exportRoutes from './routes/export.js';
import usersRoutes from './routes/users.js';

dotenv.config();

const app = express();

// CORS
app.use(cors({
  origin: (process.env.CLIENT_URL || '').replace(/\/$/, ''),
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await initDefaultManager();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;

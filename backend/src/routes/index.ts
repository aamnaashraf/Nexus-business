import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import meetingRoutes from './meeting.routes';
import documentRoutes from './document.routes';
import paymentRoutes from './payment.routes';
import videoRoutes from './video.routes';
import messageRoutes from './message.routes';

const router = Router();

// Health check route
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Nexus API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/meetings', meetingRoutes);
router.use('/documents', documentRoutes);
router.use('/payments', paymentRoutes);
router.use('/video', videoRoutes);
router.use('/messages', messageRoutes);

export default router;
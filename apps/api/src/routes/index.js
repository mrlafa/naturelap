import { Router } from 'express';
import healthCheck from './health-check.js';
import authRoutes from './auth.js';
import catalogRoutes from './catalog.js';
import cartRoutes from './cart.js';
import orderRoutes from './orders.js';
import bookingRoutes from './bookings.js';
import paymentRoutes from './payments.js';
import userRoutes from './users.js';
import notificationRoutes from './notifications.js';
import promotionRoutes from './promotions.js';
import analyticsRoutes from './analytics.js';
import supportRoutes from './support.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/auth', authRoutes);
    router.use('/catalog', catalogRoutes);
    router.use('/cart', cartRoutes);
    router.use('/orders', orderRoutes);
    router.use('/bookings', bookingRoutes);
    router.use('/payments', paymentRoutes);
    router.use('/users', userRoutes);
    router.use('/notifications', notificationRoutes);
    router.use('/promotions', promotionRoutes);
    router.use('/analytics', analyticsRoutes);
    router.use('/support', supportRoutes);

    return router;
};

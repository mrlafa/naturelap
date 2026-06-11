import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const result = await req.pb.collection('bookings').getList(
    Math.max(1, Number(req.query.page) || 1),
    Math.min(100, Number(req.query.perPage) || 25),
    { sort: '-created', expand: 'hostel_id' }
  );
  return res.json(result);
});

router.post('/', async (req, res) => {
  const booking = await req.pb.collection('bookings').create({
    ...req.body,
    user_id: req.user.id,
    status: req.body.status || 'pending',
  });
  await req.pb.collection('notifications').create({
    user_id: req.user.id,
    type: 'booking',
    title: 'Stay reserved',
    message: 'Your Naturelap stay has been reserved. You can review the details in booking history.',
    action_url: '/bookings',
    read: false,
    metadata: { booking_id: booking.id },
  });
  return res.status(201).json({ booking });
});

export default router;

import { Router } from 'express';
import { createPocketBaseClient } from '../utils/clientFactory.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/events', async (req, res) => {
  const client = createPocketBaseClient(
    (req.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  );
  const event = await client.collection('analytics_events').create({
    user_id: req.body.user_id || '',
    session_id: req.body.session_id || '',
    event_name: req.body.event_name,
    entity_type: req.body.entity_type || '',
    entity_id: req.body.entity_id || '',
    path: req.body.path || '',
    metadata: req.body.metadata || {},
  });
  return res.status(201).json({ event });
});

router.get('/summary', requireAuth, requireAdmin, async (req, res) => {
  const [events, orders, bookings, users, products] = await Promise.all([
    req.pb.collection('analytics_events').getList(1, 500, { sort: '-created' }),
    req.pb.collection('orders').getList(1, 500, { sort: '-created' }),
    req.pb.collection('bookings').getList(1, 500, { sort: '-created' }),
    req.pb.collection('users').getList(1, 500, { sort: '-created' }),
    req.pb.collection('products').getList(1, 500, { sort: '-created' }),
  ]);

  const eventCounts = events.items.reduce((counts, event) => {
    counts[event.event_name] = (counts[event.event_name] || 0) + 1;
    return counts;
  }, {});

  return res.json({
    totals: {
      users: users.totalItems,
      products: products.totalItems,
      orders: orders.totalItems,
      bookings: bookings.totalItems,
      revenue: orders.items
        .filter((order) => order.status !== 'cancelled')
        .reduce((sum, order) => sum + Number(order.total || 0), 0),
      booking_value: bookings.items
        .filter((booking) => booking.status !== 'cancelled')
        .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0),
    },
    eventCounts,
    recentEvents: events.items.slice(0, 25),
  });
});

export default router;

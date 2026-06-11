import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const result = await req.pb.collection('orders').getList(
    Math.max(1, Number(req.query.page) || 1),
    Math.min(100, Number(req.query.perPage) || 25),
    { sort: '-created' }
  );
  return res.json(result);
});

router.get('/:id', async (req, res) => {
  const [order, items] = await Promise.all([
    req.pb.collection('orders').getOne(req.params.id),
    req.pb.collection('order_items').getFullList({
      filter: req.pb.filter('order_id = {:orderId}', { orderId: req.params.id }),
    }),
  ]);
  return res.json({ order, items });
});

router.post('/', async (req, res) => {
  const { items = [], ...orderData } = req.body;
  if (!items.length) return res.status(400).json({ error: 'At least one order item is required' });

  const order = await req.pb.collection('orders').create({
    ...orderData,
    order_number: orderData.order_number || `NL-${Date.now().toString().slice(-9)}`,
    user_id: req.user.id,
    payment_status: orderData.payment_status || 'pending',
    status: orderData.status || 'pending',
  });

  const createdItems = await Promise.all(items.map((item) =>
    req.pb.collection('order_items').create({
      ...item,
      order_id: order.id,
      user_id: req.user.id,
    })
  ));

  await req.pb.collection('notifications').create({
    user_id: req.user.id,
    type: 'order',
    title: 'Order received',
    message: `Your order ${order.order_number} has been received and is awaiting confirmation.`,
    action_url: '/orders',
    read: false,
    metadata: { order_id: order.id, order_number: order.order_number },
  });

  return res.status(201).json({ order, items: createdItems });
});

export default router;

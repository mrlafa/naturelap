import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const filter = req.query.unread === 'true' ? 'read = false' : '';
  const result = await req.pb.collection('notifications').getList(
    Math.max(1, Number(req.query.page) || 1),
    Math.min(100, Number(req.query.perPage) || 30),
    { filter, sort: '-created' }
  );
  return res.json(result);
});

router.post('/', async (req, res) => {
  const notification = await req.pb.collection('notifications').create({
    user_id: req.user.id,
    type: req.body.type || 'system',
    title: req.body.title,
    message: req.body.message,
    action_url: req.body.action_url || '',
    read: false,
    metadata: req.body.metadata || {},
  });
  return res.status(201).json({ notification });
});

router.patch('/:id/read', async (req, res) => {
  const notification = await req.pb.collection('notifications').update(req.params.id, { read: true });
  return res.json({ notification });
});

router.post('/read-all', async (req, res) => {
  const unread = await req.pb.collection('notifications').getFullList({ filter: 'read = false' });
  await Promise.all(unread.map((item) => req.pb.collection('notifications').update(item.id, { read: true })));
  return res.json({ updated: unread.length });
});

export default router;

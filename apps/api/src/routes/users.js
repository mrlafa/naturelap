import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/me', (req, res) => res.json({ user: req.user }));

router.patch('/me', async (req, res) => {
  const allowedFields = [
    'name',
    'phone',
    'bio',
    'address',
    'city',
    'country',
    'email_notifications',
    'push_notifications',
  ];
  const payload = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );
  const user = await req.pb.collection('users').update(req.user.id, payload);
  return res.json({ user });
});

router.get('/', requireAdmin, async (req, res) => {
  const result = await req.pb.collection('users').getList(
    Math.max(1, Number(req.query.page) || 1),
    Math.min(250, Number(req.query.perPage) || 50),
    { sort: '-created' }
  );
  return res.json(result);
});

router.patch('/:id/access', requireAdmin, async (req, res) => {
  const role = ['user', 'staff', 'admin'].includes(req.body.role) ? req.body.role : 'user';
  const permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];
  const user = await req.pb.collection('users').update(req.params.id, { role, permissions });
  return res.json({ user });
});

export default router;

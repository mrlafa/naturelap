import { Router } from 'express';
import { createPocketBaseClient } from '../utils/clientFactory.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const client = createPocketBaseClient();
  const authData = await client.collection('users').authWithPassword(email, password);
  return res.json({ token: authData.token, user: authData.record });
});

router.post('/register', async (req, res) => {
  const { email, password, passwordConfirm = password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Name, email, and password are required' });

  const client = createPocketBaseClient();
  await client.collection('users').create({
    email,
    password,
    passwordConfirm,
    name,
    role: 'user',
  });
  const authData = await client.collection('users').authWithPassword(email, password);
  return res.status(201).json({ token: authData.token, user: authData.record });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/conversations', async (req, res) => {
  const conversations = await req.pb.collection('support_conversations').getFullList({
    sort: '-last_message_at',
  });
  return res.json({ items: conversations });
});

router.post('/conversations', async (req, res) => {
  const conversation = await req.pb.collection('support_conversations').create({
    user_id: req.user.id,
    subject: req.body.subject,
    status: 'open',
    priority: req.body.priority || 'normal',
  });
  const message = await req.pb.collection('support_messages').create({
    conversation_id: conversation.id,
    user_id: req.user.id,
    sender_id: req.user.id,
    sender_type: req.user.role === 'admin' || req.user.role === 'staff' ? 'staff' : 'customer',
    message: req.body.message,
    attachments: [],
    read: false,
  });
  return res.status(201).json({ conversation, message });
});

router.get('/conversations/:id/messages', async (req, res) => {
  const items = await req.pb.collection('support_messages').getFullList({
    filter: req.pb.filter('conversation_id = {:conversationId}', { conversationId: req.params.id }),
    sort: 'created',
  });
  return res.json({ items });
});

router.post('/conversations/:id/messages', async (req, res) => {
  const conversation = await req.pb.collection('support_conversations').getOne(req.params.id);
  const message = await req.pb.collection('support_messages').create({
    conversation_id: conversation.id,
    user_id: conversation.user_id,
    sender_id: req.user.id,
    sender_type: req.user.role === 'admin' || req.user.role === 'staff' ? 'staff' : 'customer',
    message: req.body.message,
    attachments: [],
    read: false,
  });
  await req.pb.collection('support_conversations').update(conversation.id, {
    status: req.user.role === 'admin' || req.user.role === 'staff' ? 'waiting' : 'open',
  });
  return res.status(201).json({ message });
});

router.patch('/conversations/:id', async (req, res) => {
  const conversation = await req.pb.collection('support_conversations').update(req.params.id, {
    status: req.body.status,
    priority: req.body.priority,
    assigned_to: req.body.assigned_to,
  });
  return res.json({ conversation });
});

export default router;

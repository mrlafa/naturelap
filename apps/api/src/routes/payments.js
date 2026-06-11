import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const configuredProviders = new Set(
  (process.env.CONFIGURED_PAYMENT_PROVIDERS || 'cod')
    .split(',')
    .map((provider) => provider.trim())
    .filter(Boolean)
);

router.post('/intents', async (req, res) => {
  const { provider, amount, currency = 'NPR', order_id = '', booking_id = '' } = req.body;
  if (!provider || !amount) return res.status(400).json({ error: 'Provider and amount are required' });

  const payment = await req.pb.collection('payments').create({
    user_id: req.user.id,
    provider,
    amount,
    currency,
    order_id,
    booking_id,
    status: 'pending',
    metadata: { source: 'api' },
  });

  if (!configuredProviders.has(provider)) {
    return res.status(202).json({
      payment,
      ready: false,
      requiresConfiguration: true,
      message: `${provider} credentials are not configured`,
    });
  }

  return res.status(201).json({
    payment,
    ready: provider === 'cod',
    nextAction: provider === 'cod' ? 'collect_on_delivery' : 'initialize_provider_checkout',
  });
});

export default router;

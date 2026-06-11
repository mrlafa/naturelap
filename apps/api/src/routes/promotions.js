import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/validate-coupon', async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const subtotal = Number(req.body.subtotal) || 0;
  if (!code) return res.status(400).json({ error: 'Coupon code is required' });

  let coupon;
  try {
    coupon = await req.pb.collection('coupons').getFirstListItem(
      req.pb.filter('code = {:code} && active = true', { code })
    );
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ error: 'Coupon not found or inactive' });
    throw error;
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return res.status(400).json({ error: 'This coupon is not active yet' });
  }
  if (coupon.ends_at && new Date(coupon.ends_at) < now) {
    return res.status(400).json({ error: 'This coupon has expired' });
  }
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    return res.status(400).json({ error: 'This coupon has reached its usage limit' });
  }
  if (subtotal < Number(coupon.minimum_order || 0)) {
    return res.status(400).json({
      error: `Minimum order is NPR ${Number(coupon.minimum_order).toLocaleString()}`,
    });
  }

  let discount = coupon.discount_type === 'percentage'
    ? subtotal * (Number(coupon.value) / 100)
    : Number(coupon.value);
  if (coupon.maximum_discount) discount = Math.min(discount, Number(coupon.maximum_discount));
  discount = Math.min(subtotal, Math.round(discount));

  return res.json({
    coupon: {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discount_type: coupon.discount_type,
      value: coupon.value,
    },
    discount,
  });
});

router.get('/referrals', async (req, res) => {
  const [affiliate, referrals] = await Promise.all([
    req.pb.collection('affiliates').getFirstListItem(
      req.pb.filter('user_id = {:userId}', { userId: req.user.id })
    ).catch(() => null),
    req.pb.collection('referrals').getFullList({ sort: '-created' }),
  ]);
  return res.json({ affiliate, referrals });
});

router.post('/referrals', async (req, res) => {
  const affiliate = await req.pb.collection('affiliates').getFirstListItem(
    req.pb.filter('user_id = {:userId}', { userId: req.user.id })
  );
  const referral = await req.pb.collection('referrals').create({
    referrer_user_id: req.user.id,
    code: affiliate.code,
    invite_email: req.body.email || '',
    status: 'invited',
    reward_amount: 500,
  });
  return res.status(201).json({ referral });
});

export default router;

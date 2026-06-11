import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const findActiveCart = async (req) => {
  try {
    return await req.pb.collection('carts').getFirstListItem(
      req.pb.filter('user_id = {:userId} && status = "active"', { userId: req.user.id })
    );
  } catch (error) {
    if (error.status !== 404) throw error;
    return req.pb.collection('carts').create({ user_id: req.user.id, status: 'active' });
  }
};

router.get('/', async (req, res) => {
  const cart = await findActiveCart(req);
  const items = await req.pb.collection('cart_items').getFullList({
    filter: req.pb.filter('cart_id = {:cartId}', { cartId: cart.id }),
    sort: 'created',
  });
  return res.json({ cart, items });
});

router.post('/items', async (req, res) => {
  const { product_id, variant_id = '', quantity = 1, unit_price } = req.body;
  if (!product_id || unit_price === undefined) return res.status(400).json({ error: 'Product and unit price are required' });
  const cart = await findActiveCart(req);
  const item = await req.pb.collection('cart_items').create({
    cart_id: cart.id,
    user_id: req.user.id,
    product_id,
    variant_id,
    quantity,
    unit_price,
  });
  return res.status(201).json({ item });
});

router.patch('/items/:id', async (req, res) => {
  const item = await req.pb.collection('cart_items').update(req.params.id, {
    quantity: Math.max(1, Number(req.body.quantity) || 1),
  });
  return res.json({ item });
});

router.delete('/items/:id', async (req, res) => {
  await req.pb.collection('cart_items').delete(req.params.id);
  return res.status(204).end();
});

export default router;

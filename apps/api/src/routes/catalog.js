import { Router } from 'express';
import { createPocketBaseClient } from '../utils/clientFactory.js';

const router = Router();

router.get('/categories', async (req, res) => {
  const client = createPocketBaseClient();
  const records = await client.collection('product_categories').getFullList({ sort: 'sort_order' });
  return res.json({ items: records });
});

router.get('/products', async (req, res) => {
  const client = createPocketBaseClient();
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 24));
  const filters = [];

  if (req.query.category) {
    filters.push(client.filter('category_id = {:category}', { category: req.query.category }));
  }
  if (req.query.search) {
    filters.push(client.filter('(name ~ {:search} || short_description ~ {:search})', { search: req.query.search }));
  }

  const result = await client.collection('products').getList(page, perPage, {
    filter: filters.join(' && '),
    sort: '-created',
  });
  return res.json(result);
});

router.get('/products/:id', async (req, res) => {
  const client = createPocketBaseClient();
  const [product, variants] = await Promise.all([
    client.collection('products').getOne(req.params.id),
    client.collection('product_variants').getFullList({
      filter: client.filter('product_id = {:productId}', { productId: req.params.id }),
    }),
  ]);
  return res.json({ product, variants });
});

export default router;

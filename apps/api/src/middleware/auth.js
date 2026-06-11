import { createPocketBaseClient } from '../utils/clientFactory.js';

export const requireAuth = async (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const client = createPocketBaseClient(token);
    const authData = await client.collection('users').authRefresh();
    req.pb = client;
    req.user = authData.record;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  return next();
};

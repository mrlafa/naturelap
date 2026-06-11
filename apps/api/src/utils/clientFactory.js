import PocketBase from 'pocketbase';

export const POCKETBASE_URL =
  process.env.POCKETBASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? `https://${process.env.WEBSITE_DOMAIN}/hcgi/platform`
    : 'http://127.0.0.1:8090');

export const createPocketBaseClient = (token = '') => {
  const client = new PocketBase(POCKETBASE_URL);
  client.autoCancellation(false);
  if (token) client.authStore.save(token);
  return client;
};

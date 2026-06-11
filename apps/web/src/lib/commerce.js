export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const getItemKey = (productId, variantId = '') => `${productId}:${variantId}`;

export const getProductImage = (product) =>
  product?.image_url ||
  product?.gallery?.[0] ||
  'https://images.unsplash.com/photo-1551632811-561732d1e306';

export const getDiscountPercent = (price, compareAtPrice) => {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

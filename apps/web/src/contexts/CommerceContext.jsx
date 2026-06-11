import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getItemKey } from '@/lib/commerce';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';

const CommerceContext = createContext(null);
const CART_STORAGE_KEY = 'naturelap_cart';
const LIKES_STORAGE_KEY = 'naturelap_likes';
const SAVES_STORAGE_KEY = 'naturelap_saves';

const readStorage = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const useCommerce = () => {
  const context = useContext(CommerceContext);
  if (!context) throw new Error('useCommerce must be used inside CommerceProvider');
  return context;
};

export function CommerceProvider({ children }) {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState(() => readStorage(CART_STORAGE_KEY, []));
  const [likedItems, setLikedItems] = useState(() => readStorage(LIKES_STORAGE_KEY, []));
  const [savedItems, setSavedItems] = useState(() => readStorage(SAVES_STORAGE_KEY, []));
  const initialLikedItems = useRef(likedItems);
  const initialSavedItems = useRef(savedItems);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likedItems));
  }, [likedItems]);

  useEffect(() => {
    window.localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const syncAccountItems = async () => {
      try {
        const [likes, saves] = await Promise.all([
          pb.collection('likes').getFullList({ sort: 'created', $autoCancel: false }),
          pb.collection('saved_items').getFullList({ sort: 'created', $autoCancel: false }),
        ]);
        const remoteLikes = likes.map((item) => `${item.target_type}:${item.target_id}`);
        const remoteSaves = saves.map((item) => `${item.target_type}:${item.target_id}`);

        setLikedItems((local) => [...new Set([...local, ...remoteLikes])]);
        setSavedItems((local) => [...new Set([...local, ...remoteSaves])]);

        const missingLikes = initialLikedItems.current.filter((key) => !remoteLikes.includes(key));
        const missingSaves = initialSavedItems.current.filter((key) => !remoteSaves.includes(key));

        await Promise.all([
          ...missingLikes.map((key) => {
            const [target_type, target_id] = key.split(':');
            return pb.collection('likes').create({
              user_id: currentUser.id,
              target_type,
              target_id,
            }, { $autoCancel: false }).catch(() => null);
          }),
          ...missingSaves.map((key) => {
            const [target_type, target_id] = key.split(':');
            return pb.collection('saved_items').create({
              user_id: currentUser.id,
              target_type,
              target_id,
            }, { $autoCancel: false }).catch(() => null);
          }),
        ]);
      } catch (error) {
        console.error('Could not sync saved account items:', error);
      }
    };

    syncAccountItems();
  }, [currentUser?.id]);

  const addToCart = (product, quantity = 1, variant = null) => {
    const key = getItemKey(product.id, variant?.id);
    const unitPrice = Number(product.price) + Number(variant?.price_adjustment || 0);

    setCart((items) => {
      const existing = items.find((item) => item.key === key);
      if (existing) {
        return items.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...items,
        {
          key,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: product.image_url,
          unitPrice,
          quantity,
          stock: Number(variant?.stock ?? product.stock ?? 99),
          variantId: variant?.id || '',
          variantName: variant?.name || variant?.option_value || '',
        },
      ];
    });

    toast.success(`${product.name} added to cart`);
    trackEvent('add_to_cart', {
      entityType: 'product',
      entityId: product.id,
      metadata: { quantity, variant_id: variant?.id || '', unit_price: unitPrice },
    });
  };

  const updateQuantity = (key, quantity) => {
    setCart((items) =>
      items.map((item) =>
        item.key === key
          ? { ...item, quantity: Math.max(1, Math.min(Number(quantity) || 1, item.stock || 99)) }
          : item
      )
    );
  };

  const removeFromCart = (key) => {
    setCart((items) => items.filter((item) => item.key !== key));
  };

  const clearCart = () => setCart([]);

  const toggleStoredItem = async (target, collectionName, targetType, targetId) => {
    const key = `${targetType}:${targetId}`;
    let wasStored = false;
    target((items) => (items.includes(key) ? items.filter((item) => item !== key) : [...items, key]));

    if (collectionName === 'likes') {
      wasStored = likedItems.includes(key);
    } else {
      wasStored = savedItems.includes(key);
    }

    if (!currentUser?.id) return;

    try {
      if (wasStored) {
        const record = await pb.collection(collectionName).getFirstListItem(
          pb.filter('user_id = {:userId} && target_type = {:targetType} && target_id = {:targetId}', {
            userId: currentUser.id,
            targetType,
            targetId,
          }),
          { $autoCancel: false }
        );
        await pb.collection(collectionName).delete(record.id, { $autoCancel: false });
      } else {
        await pb.collection(collectionName).create({
          user_id: currentUser.id,
          target_type: targetType,
          target_id: targetId,
        }, { $autoCancel: false });
      }
    } catch (error) {
      console.error(`Could not update ${collectionName}:`, error);
      target((items) => (wasStored ? [...new Set([...items, key])] : items.filter((item) => item !== key)));
      toast.error('Could not sync this change to your account');
    }
  };

  const toggleLike = (targetType, targetId) => toggleStoredItem(setLikedItems, 'likes', targetType, targetId);
  const toggleSave = (targetType, targetId) => toggleStoredItem(setSavedItems, 'saved_items', targetType, targetId);
  const isLiked = (targetType, targetId) => likedItems.includes(`${targetType}:${targetId}`);
  const isSaved = (targetType, targetId) => savedItems.includes(`${targetType}:${targetId}`);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleLike,
      toggleSave,
      isLiked,
      isSaved,
      likedItems,
      savedItems,
    }),
    [cart, cartCount, subtotal, likedItems, savedItems]
  );

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

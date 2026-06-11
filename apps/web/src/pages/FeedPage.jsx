import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Heart, MapPin, Share2, ShoppingBag, Star } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { useCommerce } from '@/contexts/CommerceContext';
import { formatCurrency, getProductImage } from '@/lib/commerce';

export default function FeedPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('stay');
  const [stays, setStays] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, isLiked, isSaved, toggleLike, toggleSave } = useCommerce();

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const [stayResult, productResult] = await Promise.all([
          pb.collection('hostels').getList(1, 20, { sort: '-rating', $autoCancel: false }),
          pb.collection('products').getList(1, 20, { sort: '-created', $autoCancel: false }),
        ]);
        setStays(stayResult.items);
        setProducts(productResult.items);
      } catch (error) {
        console.error(error);
        toast.error('Could not load the discovery feed');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, []);

  const items = useMemo(
    () =>
      mode === 'stay'
        ? stays.map((stay) => ({ ...stay, feedType: 'stay' }))
        : products.map((product) => ({ ...product, feedType: 'product' })),
    [mode, stays, products]
  );

  const getImage = (item) => {
    if (item.feedType === 'product') return getProductImage(item);
    return item.images?.length ? pb.files.getUrl(item, item.images[0]) : 'https://images.unsplash.com/photo-1544735716-392fe2489ffa';
  };

  const shareItem = async (item) => {
    const path = item.feedType === 'stay' ? `/hostels/${item.id}` : `/store/${item.id}`;
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name, text: item.short_description || item.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
      await pb.collection('shares').create({
        target_type: item.feedType,
        target_id: item.id,
        channel: navigator.share ? 'native' : 'clipboard',
      }, { $autoCancel: false });
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Unable to share this item');
    }
  };

  if (loading) {
    return <div className="grid min-h-[70vh] place-items-center text-[#66736a]">Loading your feed...</div>;
  }

  return (
    <div className="bg-[#f4f2eb]">
      <section className="sticky top-16 z-30 border-b border-black/5 bg-[#f4f2eb]/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md rounded-full bg-white p-1 shadow-sm">
          {['stay', 'product'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`flex-1 rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition ${
                mode === value ? 'bg-[#18392b] text-white shadow' : 'text-[#66736a]'
              }`}
            >
              {value === 'stay' ? 'Stays' : 'Products'}
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="mx-auto h-[calc(100vh-8.1rem)] max-w-3xl snap-y snap-mandatory overflow-y-auto"
        >
          {items.map((item) => {
            const liked = isLiked(item.feedType, item.id);
            const saved = isSaved(item.feedType, item.id);
            const isStay = item.feedType === 'stay';

            return (
              <article key={item.id} className="relative h-full snap-start overflow-hidden bg-[#18392b]">
                <img src={getImage(item)} alt={item.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />

                <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 text-white md:p-10">
                  <div className="max-w-xl">
                    <div className="mb-3 flex items-center gap-3 text-sm text-white/80">
                      {isStay ? <MapPin className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                      <span>{isStay ? item.location : 'Naturelap field shop'}</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#f6b851] text-[#f6b851]" />
                        {item.rating || 'New'}
                      </span>
                    </div>
                    <h1 className="text-3xl font-semibold md:text-5xl">{item.name}</h1>
                    <p className="mt-3 line-clamp-3 max-w-lg text-sm leading-6 text-white/80 md:text-base">
                      {item.short_description || item.description}
                    </p>
                    <p className="mt-5 text-xl font-bold">
                      {formatCurrency(isStay ? item.price_per_night : item.price)}
                      {isStay && <span className="text-sm font-normal text-white/70"> / night</span>}
                    </p>
                    <Button
                      size="lg"
                      className="mt-6 rounded-full bg-[#e97845] px-7 text-white hover:bg-[#d96636]"
                      onClick={() =>
                        isStay ? navigate(`/booking/${item.id}`) : addToCart(item)
                      }
                    >
                      {isStay ? 'Book now' : 'Add to cart'}
                    </Button>
                  </div>
                </div>

                <div className="absolute bottom-9 right-4 flex flex-col gap-3 md:right-8">
                  <FeedAction
                    label="Like"
                    active={liked}
                    onClick={() => toggleLike(item.feedType, item.id)}
                    icon={<Heart className={liked ? 'fill-current' : ''} />}
                  />
                  <FeedAction
                    label="Save"
                    active={saved}
                    onClick={() => toggleSave(item.feedType, item.id)}
                    icon={<Bookmark className={saved ? 'fill-current' : ''} />}
                  />
                  <FeedAction label="Share" onClick={() => shareItem(item)} icon={<Share2 />} />
                </div>
              </article>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FeedAction({ label, icon, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/30 backdrop-blur-md transition ${
        active ? 'bg-[#e97845] text-white' : 'bg-black/25 text-white hover:bg-white/20'
      }`}
      aria-label={label}
    >
      {React.cloneElement(icon, { className: 'h-5 w-5' })}
    </button>
  );
}

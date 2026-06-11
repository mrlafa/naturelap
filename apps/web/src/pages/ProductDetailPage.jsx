import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Heart, Minus, Plus, ShieldCheck, Star, Truck } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCommerce } from '@/contexts/CommerceContext';
import { formatCurrency, getDiscountPercent, getProductImage } from '@/lib/commerce';
import { trackEvent } from '@/lib/analytics';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart, isSaved, toggleSave } = useCommerce();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const record = await pb.collection('products').getOne(id, { $autoCancel: false });
        setProduct(record);
        trackEvent('product_view', { entityType: 'product', entityId: id });
        const result = await pb.collection('product_variants').getList(1, 50, {
          filter: `product_id = "${id}"`,
          sort: 'created',
          $autoCancel: false,
        });
        setVariants(result.items);
        setSelectedVariantId(result.items[0]?.id || '');
      } catch (error) {
        console.error(error);
        toast.error('Product not found');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const price = useMemo(
    () => Number(product?.price || 0) + Number(selectedVariant?.price_adjustment || 0),
    [product, selectedVariant]
  );

  if (loading) return <div className="grid min-h-[70vh] place-items-center">Loading product...</div>;
  if (!product) return <div className="grid min-h-[70vh] place-items-center">Product not found.</div>;

  const saved = isSaved('product', product.id);
  const discount = getDiscountPercent(product.price, product.compare_at_price);

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-8 md:py-14">
      <div className="container mx-auto">
        <Button variant="ghost" asChild className="mb-6 -ml-3 text-[#53645a]">
          <Link to="/store"><ChevronLeft className="mr-1 h-4 w-4" /> Back to store</Link>
        </Button>

        <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(24,57,43,0.10)] lg:grid-cols-2">
          <div className="relative min-h-[420px] bg-[#e6e7df] lg:min-h-[680px]">
            <img src={getProductImage(product)} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
            {discount > 0 && <Badge className="absolute left-6 top-6 bg-[#e97845]">Save {discount}%</Badge>}
          </div>

          <div className="flex flex-col justify-center p-7 md:p-12 lg:p-16">
            <div className="flex items-center gap-2 text-sm text-[#67746c]">
              <Star className="h-4 w-4 fill-[#e5a33d] text-[#e5a33d]" />
              <span>{Number(product.rating || 0).toFixed(1)} customer rating</span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#18392b] md:text-5xl">{product.name}</h1>
            <p className="mt-5 text-lg leading-8 text-[#66736a]">{product.short_description}</p>

            <div className="mt-7 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#18392b]">{formatCurrency(price)}</span>
              {product.compare_at_price > product.price && (
                <span className="text-[#969d97] line-through">{formatCurrency(product.compare_at_price)}</span>
              )}
            </div>

            {variants.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[#59665e]">Choose an option</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        selectedVariantId === variant.id
                          ? 'border-[#18392b] bg-[#18392b] text-white'
                          : 'border-[#d9ddd8] text-[#4e5d54]'
                      }`}
                    >
                      {variant.option_value || variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <div className="flex h-12 items-center justify-between rounded-full border border-[#d9ddd8] px-2 sm:w-36">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold">{quantity}</span>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQuantity((value) => Math.min(product.stock || 99, value + 1))}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="lg"
                className="h-12 flex-1 rounded-full bg-[#e97845] text-white hover:bg-[#d96636]"
                onClick={() => addToCart(product, quantity, selectedVariant)}
              >
                Add to cart · {formatCurrency(price * quantity)}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => toggleSave('product', product.id)}
              >
                <Heart className={`h-5 w-5 ${saved ? 'fill-[#e97845] text-[#e97845]' : ''}`} />
              </Button>
            </div>

            <div className="mt-10 grid gap-4 border-t pt-7 text-sm text-[#66736a] sm:grid-cols-2">
              <div className="flex items-center gap-3"><Truck className="h-5 w-5 text-[#18392b]" /> Delivery across Nepal</div>
              <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#18392b]" /> Secure checkout</div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl py-14">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#788179]">Field notes</p>
          <div
            className="prose prose-lg mt-5 max-w-none text-[#56645c]"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      </div>
    </div>
  );
}

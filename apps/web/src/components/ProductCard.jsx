import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCommerce } from '@/contexts/CommerceContext';
import { formatCurrency, getDiscountPercent, getProductImage } from '@/lib/commerce';

export default function ProductCard({ product }) {
  const { addToCart, isSaved, toggleSave } = useCommerce();
  const saved = isSaved('product', product.id);
  const discount = getDiscountPercent(product.price, product.compare_at_price);

  return (
    <Card className="group overflow-hidden border-0 bg-white shadow-[0_14px_45px_rgba(24,42,31,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(24,42,31,0.14)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ebece6]">
        <Link to={`/store/${product.id}`}>
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </Link>
        {discount > 0 && (
          <Badge className="absolute left-3 top-3 bg-[#e97845] text-white hover:bg-[#e97845]">
            -{discount}%
          </Badge>
        )}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-3 top-3 rounded-full bg-white/90 shadow-sm"
          onClick={() => toggleSave('product', product.id)}
          aria-label={saved ? 'Remove from saved items' : 'Save product'}
        >
          <Heart className={`h-4 w-4 ${saved ? 'fill-[#e97845] text-[#e97845]' : ''}`} />
        </Button>
      </div>

      <CardContent className="p-5">
        <div className="mb-2 flex items-center gap-1 text-xs font-medium text-[#6c776e]">
          <Star className="h-3.5 w-3.5 fill-[#e5a33d] text-[#e5a33d]" />
          {Number(product.rating || 0).toFixed(1)}
        </div>
        <Link to={`/store/${product.id}`} className="block">
          <h3 className="line-clamp-1 text-lg font-semibold text-[#18392b]">{product.name}</h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm text-[#6c776e]">
            {product.short_description}
          </p>
        </Link>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <span className="font-bold text-[#18392b]">{formatCurrency(product.price)}</span>
            {product.compare_at_price > product.price && (
              <span className="ml-2 text-xs text-[#8a918b] line-through">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
          <Button
            size="icon"
            className="rounded-full bg-[#18392b] text-white hover:bg-[#28563f]"
            onClick={() => addToCart(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

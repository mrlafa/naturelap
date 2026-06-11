import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommerce } from '@/contexts/CommerceContext';
import { formatCurrency } from '@/lib/commerce';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, subtotal, updateQuantity, removeFromCart } = useCommerce();
  const deliveryFee = subtotal >= 10000 || subtotal === 0 ? 0 : 250;

  if (cart.length === 0) {
    return (
      <div className="grid min-h-[72vh] place-items-center bg-[#f4f2eb] px-4 text-center">
        <div>
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white shadow-sm">
            <ShoppingBag className="h-8 w-8 text-[#18392b]" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-[#18392b]">Your cart is taking a quiet break.</h1>
          <p className="mt-3 text-[#6c776e]">Add a few trail-ready things and they will appear here.</p>
          <Button asChild className="mt-7 rounded-full bg-[#18392b] px-7">
            <Link to="/store">Explore the store</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-10 md:py-16">
      <div className="container mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7b847d]">Your selection</p>
        <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">Cart</h1>

        <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.key} className="flex gap-4 rounded-3xl bg-white p-4 shadow-sm sm:gap-6 sm:p-5">
                <img src={item.image} alt={item.name} className="h-28 w-24 rounded-2xl object-cover sm:h-36 sm:w-32" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-[#18392b] sm:text-lg">{item.name}</h2>
                      {item.variantName && <p className="mt-1 text-sm text-[#7b837d]">{item.variantName}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 rounded-full text-[#9a5a44]" onClick={() => removeFromCart(item.key)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3">
                    <div className="flex items-center rounded-full border border-[#dde0dc] p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.key, item.quantity - 1)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.key, item.quantity + 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="font-bold text-[#18392b]">{formatCurrency(item.unitPrice * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-[2rem] bg-[#18392b] p-7 text-white lg:sticky lg:top-24">
            <h2 className="text-2xl font-semibold">Order summary</h2>
            <div className="mt-7 space-y-4 text-sm text-white/75">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee ? formatCurrency(deliveryFee) : 'Free'}</span></div>
            </div>
            <div className="mt-6 flex justify-between border-t border-white/20 pt-6 text-lg font-bold">
              <span>Total</span><span>{formatCurrency(subtotal + deliveryFee)}</span>
            </div>
            <Button
              size="lg"
              className="mt-7 w-full rounded-full bg-[#e97845] text-white hover:bg-[#d96636]"
              onClick={() => navigate('/checkout')}
            >
              Continue to checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-4 text-center text-xs text-white/55">Free delivery on orders over NPR 10,000</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

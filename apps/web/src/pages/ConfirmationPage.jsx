import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, MapPin, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConfirmationPage() {
  const { state } = useLocation();
  const isBooking = state?.type === 'booking';
  const title = state?.title || (isBooking ? 'Your stay is reserved.' : 'Your order is in.');
  const message = state?.message || 'We have saved your details and will keep you updated.';

  return (
    <div className="grid min-h-[78vh] place-items-center overflow-hidden bg-[#18392b] px-4 py-16 text-white">
      <div className="relative max-w-2xl text-center">
        <Sparkles className="absolute -left-12 -top-10 h-8 w-8 text-[#d5c895]/70" />
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#e97845] shadow-xl">
          <Check className="h-9 w-9" />
        </div>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-[#d5c895]">
          {isBooking ? 'Booking confirmed' : 'Order confirmed'}
        </p>
        <h1 className="mt-4 text-4xl font-semibold md:text-6xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-white/70">{message}</p>
        {state?.reference && (
          <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm">
            {isBooking ? <MapPin className="h-4 w-4" /> : <Package className="h-4 w-4" />}
            Reference: <strong>{state.reference}</strong>
          </div>
        )}
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full bg-[#e97845] px-7 hover:bg-[#d96636]">
            <Link to={isBooking ? '/bookings' : '/orders'}>
              {isBooking ? 'View bookings' : 'View orders'}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-white/30 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white">
            <Link to="/feed">Back to discovery</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

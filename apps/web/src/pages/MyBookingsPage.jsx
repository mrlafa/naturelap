import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/commerce';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pb.collection('bookings').getList(1, 100, {
      sort: '-created',
      expand: 'hostel_id',
      $autoCancel: false,
    })
      .then((result) => setBookings(result.items))
      .catch((error) => {
        console.error(error);
        toast.error('Could not load your bookings');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-12">
      <div className="container mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7b857d]">Your account</p>
        <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">Booking history</h1>
        <div className="mt-8 space-y-4">
          {loading ? (
            <p className="text-[#6c776e]">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-12 text-center shadow-sm">
              <MapPin className="mx-auto h-8 w-8 text-[#18392b]" />
              <h2 className="mt-4 text-2xl font-semibold text-[#18392b]">No stays booked yet</h2>
              <Button asChild className="mt-6 rounded-full"><Link to="/hostels">Find a stay</Link></Button>
            </div>
          ) : bookings.map((booking) => (
            <Card key={booking.id} className="rounded-3xl border-0 shadow-sm">
              <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#edf2ed]">
                    <CalendarDays className="h-5 w-5 text-[#18392b]" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#18392b]">{booking.expand?.hostel_id?.name || 'Naturelap stay'}</p>
                    <p className="mt-1 text-sm text-[#788179]">
                      {new Date(booking.check_in).toLocaleDateString()} – {new Date(booking.check_out).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <Badge variant="secondary" className="capitalize">{booking.status}</Badge>
                  <p className="font-bold text-[#18392b]">{formatCurrency(booking.total_price)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

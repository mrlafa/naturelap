import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronLeft, Circle, MapPin, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/commerce';

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      pb.collection('orders').getOne(id, { $autoCancel: false }),
      pb.collection('order_items').getFullList({
        filter: pb.filter('order_id = {:orderId}', { orderId: id }),
        $autoCancel: false,
      }),
    ])
      .then(([orderRecord, orderItems]) => {
        setOrder(orderRecord);
        setItems(orderItems);
      })
      .catch((error) => {
        console.error(error);
        toast.error('Could not load order tracking');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const currentStep = useMemo(
    () => statusSteps.indexOf(order?.status),
    [order?.status]
  );

  if (loading) return <div className="grid min-h-[70vh] place-items-center">Loading tracking...</div>;
  if (!order) return <div className="grid min-h-[70vh] place-items-center">Order not found.</div>;

  const trackingEvents = Array.isArray(order.tracking_events) ? order.tracking_events : [];

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-10 md:py-16">
      <div className="container mx-auto max-w-5xl">
        <Button variant="ghost" asChild className="-ml-3 mb-6"><Link to="/orders"><ChevronLeft className="mr-1 h-4 w-4" /> Order history</Link></Button>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7b857d]">Live tracking</p>
            <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">{order.order_number}</h1>
          </div>
          <Badge className="w-fit capitalize">{order.status}</Badge>
        </div>

        <Card className="mt-8 rounded-[2rem] border-0 shadow-sm">
          <CardContent className="p-7 md:p-10">
            <div className="grid gap-6 md:grid-cols-5">
              {statusSteps.map((status, index) => {
                const complete = index <= currentStep && order.status !== 'cancelled';
                return (
                  <div key={status} className="relative">
                    <div className={`grid h-10 w-10 place-items-center rounded-full ${complete ? 'bg-[#18392b] text-white' : 'bg-[#e7ebe7] text-[#87938b]'}`}>
                      {complete ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <p className="mt-3 text-sm font-semibold capitalize text-[#18392b]">{status}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="mt-7 grid gap-7 lg:grid-cols-2">
          <Card className="rounded-[2rem] border-0 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Shipment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Info label="Courier" value={order.courier || 'To be assigned'} />
              <Info label="Tracking number" value={order.tracking_number || 'Not available yet'} />
              <Info label="Delivery address" value={`${order.address}, ${order.city}`} />
              {order.tracking_url && <Button asChild variant="outline"><a href={order.tracking_url} target="_blank" rel="noreferrer">Open courier tracking</a></Button>}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Items</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 border-b pb-3 last:border-0">
                  <div><p className="font-medium">{item.product_name}</p><p className="text-xs text-muted-foreground">Qty {item.quantity} {item.variant_name && `· ${item.variant_name}`}</p></div>
                  <p className="font-semibold">{formatCurrency(item.total)}</p>
                </div>
              ))}
              <div className="flex justify-between pt-3 text-lg font-bold"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </CardContent>
          </Card>
        </div>

        {(trackingEvents.length > 0 || order.last_location) && (
          <Card className="mt-7 rounded-[2rem] border-0 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Tracking activity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {order.last_location?.label && <p className="rounded-xl bg-[#edf2ed] p-4 font-medium text-[#18392b]">Latest location: {order.last_location.label}</p>}
              {trackingEvents.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="border-l-2 border-[#d8ded9] pl-4">
                  <p className="font-medium">{event.label || event.status}</p>
                  <p className="text-sm text-muted-foreground">{event.location || ''} {event.timestamp ? `· ${new Date(event.timestamp).toLocaleString()}` : ''}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-medium text-[#18392b]">{value}</p></div>;
}

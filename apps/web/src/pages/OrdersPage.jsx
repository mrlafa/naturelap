import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/commerce';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pb.collection('orders').getList(1, 100, { sort: '-created', $autoCancel: false })
      .then((result) => setOrders(result.items))
      .catch((error) => {
        console.error(error);
        toast.error('Could not load your orders');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-12">
      <div className="container mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7b857d]">Your account</p>
        <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">Order history</h1>
        <div className="mt-8 space-y-4">
          {loading ? (
            <p className="text-[#6c776e]">Loading orders...</p>
          ) : orders.length === 0 ? (
            <EmptyState title="No orders yet" action="/store" actionLabel="Visit the store" />
          ) : orders.map((order) => (
            <Card key={order.id} className="rounded-3xl border-0 shadow-sm">
              <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#edf2ed]">
                    <Package className="h-5 w-5 text-[#18392b]" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#18392b]">{order.order_number}</p>
                    <p className="mt-1 text-sm text-[#788179]">{new Date(order.created).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <Badge variant="secondary" className="capitalize">{order.status}</Badge>
                  <p className="font-bold text-[#18392b]">{formatCurrency(order.total)}</p>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link to={`/orders/${order.id}`}>Track</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, action, actionLabel }) {
  return (
    <div className="rounded-[2rem] bg-white p-12 text-center shadow-sm">
      <Package className="mx-auto h-8 w-8 text-[#18392b]" />
      <h2 className="mt-4 text-2xl font-semibold text-[#18392b]">{title}</h2>
      <Button asChild className="mt-6 rounded-full"><Link to={action}>{actionLabel}</Link></Button>
    </div>
  );
}

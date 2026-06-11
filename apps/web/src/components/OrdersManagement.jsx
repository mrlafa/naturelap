import React, { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, Clock3, PackageCheck, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/commerce';

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await pb.collection('orders').getList(1, 250, { sort: '-created', $autoCancel: false });
      setOrders(result.items);
    } catch (error) {
      console.error(error);
      toast.error('Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const report = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => order.status === 'pending').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
    revenue: orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total), 0),
  }), [orders]);

  const updateStatus = async (order, status) => {
    try {
      await pb.collection('orders').update(order.id, { status }, { $autoCancel: false });
      setOrders((items) => items.map((item) => item.id === order.id ? { ...item, status } : item));
      toast.success(`${order.order_number} updated`);
    } catch (error) {
      console.error(error);
      toast.error('Could not update order');
    }
  };

  const metrics = [
    { label: 'Orders', value: report.total, icon: ShoppingCart },
    { label: 'Pending', value: report.pending, icon: Clock3 },
    { label: 'Delivered', value: report.delivered, icon: PackageCheck },
    { label: 'Gross sales', value: formatCurrency(report.revenue), icon: CircleDollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
        <p className="text-sm text-muted-foreground">Monitor sales and move orders through fulfillment.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center">Loading orders...</TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No orders yet.</TableCell></TableRow>
            ) : orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created).toLocaleDateString()}</p>
                </TableCell>
                <TableCell>
                  <p>{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{order.phone}</p>
                </TableCell>
                <TableCell className="capitalize">{order.payment_method} · {order.payment_status}</TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <Select value={order.status} onValueChange={(value) => updateStatus(order, value)}>
                    <SelectTrigger className="w-36 capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Landmark, PackageCheck, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useCommerce } from '@/contexts/CommerceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/commerce';
import apiServerClient from '@/lib/apiServerClient';
import { trackEvent } from '@/lib/analytics';

const paymentMethods = [
  { id: 'cod', label: 'Cash on delivery', detail: 'Pay when your order arrives', icon: PackageCheck },
  { id: 'esewa', label: 'eSewa', detail: 'Recorded for gateway processing', icon: WalletCards },
  { id: 'khalti', label: 'Khalti', detail: 'Recorded for gateway processing', icon: Landmark },
  { id: 'stripe', label: 'Card / Stripe', detail: 'Recorded for secure card processing', icon: CreditCard },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cart, subtotal, clearCart } = useCommerce();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });

  const deliveryFee = subtotal >= 10000 || subtotal === 0 ? 0 : 250;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const updateField = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const response = await apiServerClient.fetch('/promotions/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Coupon could not be applied');
      setAppliedCoupon(data.coupon);
      setDiscount(data.discount);
      toast.success(`${data.coupon.code} applied`);
      trackEvent('coupon_applied', {
        entityType: 'coupon',
        entityId: data.coupon.id,
        metadata: { code: data.coupon.code, discount: data.discount },
      });
    } catch (error) {
      setAppliedCoupon(null);
      setDiscount(0);
      toast.error(error.message);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      navigate('/store');
      return;
    }

    setSubmitting(true);
    try {
      const orderNumber = `NL-${Date.now().toString().slice(-9)}`;
      const order = await pb.collection('orders').create({
        ...formData,
        order_number: orderNumber,
        user_id: currentUser.id,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        coupon_code: appliedCoupon?.code || '',
        discount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
        status: 'pending',
      }, { $autoCancel: false });

      await Promise.all(
        cart.map((item) =>
          pb.collection('order_items').create({
            order_id: order.id,
            user_id: currentUser.id,
            product_id: item.productId,
            variant_id: item.variantId,
            product_name: item.name,
            variant_name: item.variantName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.unitPrice * item.quantity,
          }, { $autoCancel: false })
        )
      );

      await pb.collection('payments').create({
        user_id: currentUser.id,
        order_id: order.id,
        provider: paymentMethod,
        amount: total,
        currency: 'NPR',
        status: 'pending',
        metadata: { order_number: orderNumber },
      }, { $autoCancel: false });

      await pb.collection('notifications').create({
        user_id: currentUser.id,
        type: 'order',
        title: 'Order received',
        message: `Your order ${orderNumber} has been received and is awaiting confirmation.`,
        action_url: '/orders',
        read: false,
        metadata: { order_id: order.id, order_number: orderNumber },
      }, { $autoCancel: false });

      clearCart();
      trackEvent('purchase', {
        entityType: 'order',
        entityId: order.id,
        metadata: { order_number: orderNumber, total, payment_method: paymentMethod, discount },
      });
      navigate('/confirmation', {
        replace: true,
        state: {
          type: 'order',
          reference: orderNumber,
          title: 'Your order is in.',
          message:
            paymentMethod === 'cod'
              ? 'We will confirm the order and prepare it for delivery.'
              : 'Your order is reserved. The selected payment provider will be completed when its live credentials are connected.',
        },
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Could not place your order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-10 md:py-16">
      <form onSubmit={placeOrder} className="container mx-auto grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#79837b]">Secure checkout</p>
          <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">Where should we send it?</h1>

          <Card className="mt-8 rounded-[2rem] border-0 shadow-sm">
            <CardHeader><CardTitle>Customer information</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" name="customer_name" value={formData.customer_name} onChange={updateField} />
              <Field label="Email" name="email" type="email" value={formData.email} onChange={updateField} />
              <Field label="Phone" name="phone" value={formData.phone} onChange={updateField} />
              <Field label="City" name="city" value={formData.city} onChange={updateField} />
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Delivery address</Label>
                <Input id="address" name="address" value={formData.address} onChange={updateField} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Delivery notes</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={updateField} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 rounded-[2rem] border-0 shadow-sm">
            <CardHeader><CardTitle>Payment method</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      paymentMethod === method.id
                        ? 'border-[#18392b] bg-[#eef2ed]'
                        : 'border-[#e2e4e1] hover:border-[#a9b3ac]'
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white">
                      <Icon className="h-5 w-5 text-[#18392b]" />
                    </span>
                    <span>
                      <span className="block font-semibold text-[#18392b]">{method.label}</span>
                      <span className="mt-0.5 block text-xs text-[#738078]">{method.detail}</span>
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="mt-6 rounded-[2rem] border-0 shadow-sm">
            <CardHeader><CardTitle>Coupon</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  placeholder="Try NATURE10"
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setDiscount(0);
                      setCouponCode('');
                    }}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={applyCoupon} disabled={validatingCoupon}>
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </Button>
                )}
              </div>
              {appliedCoupon && <p className="mt-3 text-sm font-medium text-[#28563f]">{appliedCoupon.name}: -{formatCurrency(discount)}</p>}
            </CardContent>
          </Card>
        </div>

        <aside className="h-fit rounded-[2rem] bg-[#18392b] p-7 text-white lg:sticky lg:top-24">
          <h2 className="text-2xl font-semibold">Order summary</h2>
          <div className="mt-6 max-h-80 space-y-4 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.key} className="flex gap-3">
                <img src={item.image} alt={item.name} className="h-16 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-white/55">Qty {item.quantity}</p>
                </div>
                <p className="text-sm">{formatCurrency(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t border-white/20 pt-6 text-sm text-white/70">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee ? formatCurrency(deliveryFee) : 'Free'}</span></div>
            {discount > 0 && <div className="flex justify-between text-[#d5c895]"><span>Coupon</span><span>-{formatCurrency(discount)}</span></div>}
          </div>
          <div className="mt-5 flex justify-between text-xl font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
          <Button type="submit" size="lg" disabled={submitting} className="mt-7 w-full rounded-full bg-[#e97845] hover:bg-[#d96636]">
            {submitting ? 'Placing order...' : 'Place order'}
          </Button>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} value={value} onChange={onChange} required />
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/commerce';
import { trackEvent } from '@/lib/analytics';

export default function BookingPage() {
  const { hostelId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [hostel, setHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomId: '',
    name: currentUser?.name || '',
    phone: '',
    paymentMethod: 'cod',
  });

  useEffect(() => {
    const loadStay = async () => {
      try {
        const stay = await pb.collection('hostels').getOne(hostelId, { $autoCancel: false });
        setHostel(stay);
        const roomResult = await pb.collection('rooms').getList(1, 50, {
          filter: `hostel_id = "${hostelId}"`,
          sort: 'price',
          $autoCancel: false,
        });
        const availableRooms = roomResult.items.filter((room) => Number(room.available_rooms) > 0);
        setRooms(availableRooms);
        setFormData((current) => ({ ...current, roomId: availableRooms[0]?.id || `stay-${hostelId}` }));
      } catch (error) {
        console.error(error);
        toast.error('Failed to load stay details');
        navigate('/hostels');
      } finally {
        setLoading(false);
      }
    };
    loadStay();
  }, [hostelId, navigate]);

  const selectedRoom = rooms.find((room) => room.id === formData.roomId);
  const nightlyRate = Number(selectedRoom?.price || hostel?.price_per_night || 0);
  const nights = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const difference = new Date(formData.checkOut) - new Date(formData.checkIn);
    return Math.max(0, Math.ceil(difference / 86400000));
  }, [formData.checkIn, formData.checkOut]);
  const total = nights * nightlyRate;

  const updateField = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    if (nights < 1) return toast.error('Check-out must be after check-in');
    if (selectedRoom && Number(formData.guests) > Number(selectedRoom.capacity)) {
      return toast.error(`This room allows up to ${selectedRoom.capacity} guests`);
    }

    setSubmitting(true);
    try {
      const booking = await pb.collection('bookings').create({
        user_id: currentUser.id,
        hostel_id: hostel.id,
        room_id: formData.roomId,
        check_in: new Date(formData.checkIn).toISOString(),
        check_out: new Date(formData.checkOut).toISOString(),
        guests: Number(formData.guests),
        total_price: total,
        status: formData.paymentMethod === 'cod' ? 'confirmed' : 'pending',
      }, { $autoCancel: false });

      await pb.collection('payments').create({
        user_id: currentUser.id,
        booking_id: booking.id,
        provider: formData.paymentMethod,
        amount: total,
        currency: 'NPR',
        status: 'pending',
        metadata: {
          stay: hostel.name,
          guest_name: formData.name,
          phone: formData.phone,
        },
      }, { $autoCancel: false });

      await pb.collection('notifications').create({
        user_id: currentUser.id,
        type: 'booking',
        title: 'Stay reserved',
        message: `${nights} night${nights === 1 ? '' : 's'} at ${hostel.name} ${formData.paymentMethod === 'cod' ? 'is confirmed' : 'is being held for payment'}.`,
        action_url: '/bookings',
        read: false,
        metadata: { booking_id: booking.id, hostel_id: hostel.id },
      }, { $autoCancel: false });

      trackEvent('booking_completed', {
        entityType: 'booking',
        entityId: booking.id,
        metadata: { hostel_id: hostel.id, nights, guests: Number(formData.guests), total },
      });

      navigate('/confirmation', {
        replace: true,
        state: {
          type: 'booking',
          reference: booking.id,
          title: 'Your mountain stay is reserved.',
          message:
            formData.paymentMethod === 'cod'
              ? `We have reserved ${nights} night${nights === 1 ? '' : 's'} at ${hostel.name}.`
              : `Your dates at ${hostel.name} are held while the selected payment provider is completed.`,
        },
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="grid min-h-[70vh] place-items-center">Loading stay...</div>;

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-10 md:py-16">
      <div className="container mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7b847d]">Reserve your stay</p>
        <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">A few details, then the mountains.</h1>

        <form onSubmit={submitBooking} className="mt-9 grid gap-8 lg:grid-cols-[1fr_390px]">
          <Card className="rounded-[2rem] border-0 shadow-sm">
            <CardHeader><CardTitle>Booking details</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-in</Label>
                <Input id="checkIn" name="checkIn" type="date" min={new Date().toISOString().split('T')[0]} value={formData.checkIn} onChange={updateField} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-out</Label>
                <Input id="checkOut" name="checkOut" type="date" min={formData.checkIn || new Date().toISOString().split('T')[0]} value={formData.checkOut} onChange={updateField} required />
              </div>

              {rooms.length > 0 && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Room</Label>
                  <Select value={formData.roomId} onValueChange={(value) => setFormData((current) => ({ ...current, roomId: value }))}>
                    <SelectTrigger><SelectValue placeholder="Choose a room" /></SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.room_type} · {formatCurrency(room.price)} · up to {room.capacity} guests
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="guests">Guests</Label>
                <Input id="guests" name="guests" type="number" min="1" max={selectedRoom?.capacity || 20} value={formData.guests} onChange={updateField} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Lead guest</Label>
                <Input id="name" name="name" value={formData.name} onChange={updateField} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={updateField} required />
              </div>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData((current) => ({ ...current, paymentMethod: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod">Pay at property</SelectItem>
                    <SelectItem value="esewa">eSewa</SelectItem>
                    <SelectItem value="khalti">Khalti</SelectItem>
                    <SelectItem value="stripe">Card / Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <aside className="h-fit rounded-[2rem] bg-[#18392b] p-7 text-white lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d5c895]">Your stay</p>
            <h2 className="mt-3 text-2xl font-semibold">{hostel.name}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/65"><MapPin className="h-4 w-4" /> {hostel.location}</p>
            <div className="mt-7 space-y-3 border-t border-white/20 pt-6 text-sm text-white/70">
              <div className="flex justify-between"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Nights</span><span>{nights}</span></div>
              <div className="flex justify-between"><span className="flex items-center gap-2"><Users className="h-4 w-4" /> Guests</span><span>{formData.guests}</span></div>
              <div className="flex justify-between"><span>Nightly rate</span><span>{formatCurrency(nightlyRate)}</span></div>
            </div>
            <div className="mt-6 flex justify-between border-t border-white/20 pt-6 text-xl font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
            <Button type="submit" size="lg" disabled={submitting || total <= 0} className="mt-7 w-full rounded-full bg-[#e97845] hover:bg-[#d96636]">
              {submitting ? 'Reserving...' : 'Confirm booking'}
            </Button>
          </aside>
        </form>
      </div>
    </div>
  );
}

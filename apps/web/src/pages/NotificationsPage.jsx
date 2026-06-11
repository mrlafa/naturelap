import React, { useEffect, useState } from 'react';
import { Bell, CalendarDays, CheckCheck, Package, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const notificationIcons = {
  order: Package,
  booking: CalendarDays,
  promotion: Sparkles,
  system: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const result = await pb.collection('notifications').getList(1, 100, {
        sort: '-created',
        $autoCancel: false,
      });
      setNotifications(result.items);
    } catch (error) {
      console.error(error);
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (notification) => {
    if (notification.read) return;
    try {
      await pb.collection('notifications').update(notification.id, { read: true }, { $autoCancel: false });
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch (error) {
      console.error(error);
      toast.error('Could not mark notification as read');
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((item) => !item.read);
    await Promise.all(unread.map((item) => pb.collection('notifications').update(item.id, { read: true }, { $autoCancel: false })));
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    toast.success('All notifications marked as read');
  };

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-10 md:py-16">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7b857d]">Your account</p>
            <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">Notifications</h1>
          </div>
          {notifications.some((item) => !item.read) && (
            <Button variant="outline" className="rounded-full" onClick={markAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>

        <div className="mt-8 space-y-3">
          {loading ? (
            <p className="text-[#6d786f]">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-12 text-center shadow-sm">
              <Bell className="mx-auto h-9 w-9 text-[#18392b]" />
              <h2 className="mt-5 text-2xl font-semibold text-[#18392b]">You are all caught up</h2>
              <p className="mt-2 text-[#728078]">Order, booking, and account updates will appear here.</p>
            </div>
          ) : notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const content = (
              <Card className={`rounded-3xl border-0 shadow-sm transition ${notification.read ? 'bg-white/70' : 'bg-white ring-1 ring-[#d7c78c]'}`}>
                <CardContent className="flex gap-4 p-5">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${notification.read ? 'bg-[#edf0ed]' : 'bg-[#fff2e9]'}`}>
                    <Icon className={`h-5 w-5 ${notification.read ? 'text-[#53645a]' : 'text-[#e97845]'}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-4">
                      <h2 className="font-semibold text-[#18392b]">{notification.title}</h2>
                      {!notification.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#e97845]" />}
                    </div>
                    <p className="mt-1 leading-6 text-[#6d786f]">{notification.message}</p>
                    <p className="mt-3 text-xs text-[#8a928c]">{new Date(notification.created).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            );

            return notification.action_url ? (
              <Link key={notification.id} to={notification.action_url} onClick={() => markRead(notification)}>{content}</Link>
            ) : (
              <button key={notification.id} type="button" className="block w-full text-left" onClick={() => markRead(notification)}>{content}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

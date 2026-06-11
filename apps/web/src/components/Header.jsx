import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Bookmark, CircleUserRound, Menu, Mountain, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCommerce } from '@/contexts/CommerceContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Header() {
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCommerce();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.id) {
      setUnreadCount(0);
      return;
    }

    pb.collection('notifications').getList(1, 1, {
      filter: 'read = false',
      $autoCancel: false,
    })
      .then((result) => setUnreadCount(result.totalItems))
      .catch(() => setUnreadCount(0));
  }, [currentUser?.id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLinks = () => (
    <>
      <Link to="/feed" className="text-sm font-medium transition-colors hover:text-[#e97845]">Feed</Link>
      <Link to="/hostels" className="text-sm font-medium transition-colors hover:text-[#e97845]">Stays</Link>
      <Link to="/store" className="text-sm font-medium transition-colors hover:text-[#e97845]">Store</Link>
      <Link to="/about" className="text-sm font-medium transition-colors hover:text-[#e97845]">About</Link>
      {isAuthenticated && (
        <>
          <Link to="/bookings" className="text-sm font-medium transition-colors hover:text-[#e97845]">Bookings</Link>
          <Link to="/orders" className="text-sm font-medium transition-colors hover:text-[#e97845]">Orders</Link>
          <Link to="/saved" className="text-sm font-medium transition-colors hover:text-[#e97845]">Saved</Link>
        </>
      )}
      {isAdmin && <Link to="/admin" className="text-sm font-semibold text-[#e97845]">Admin</Link>}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[#fbfaf6]/95 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#18392b]">
            <Mountain className="h-5 w-5 text-white" />
          </span>
          <span className="font-serif text-xl font-bold tracking-tight text-[#18392b]">Naturelap</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex"><NavLinks /></nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated && (
            <>
              <Button variant="ghost" size="icon" asChild className="rounded-full">
                <Link to="/saved" aria-label="Saved items"><Bookmark className="h-5 w-5" /></Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="relative rounded-full">
                <Link to="/notifications" aria-label={`Notifications with ${unreadCount} unread`}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#e97845] px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" asChild className="relative rounded-full">
            <Link to="/cart" aria-label={`Cart with ${cartCount} items`}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#e97845] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>
          {isAuthenticated ? (
            <>
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/profile"><CircleUserRound className="mr-2 h-4 w-4" /> Profile</Link>
              </Button>
              <Button variant="ghost" className="rounded-full" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/login">Log in</Link></Button>
              <Button className="rounded-full bg-[#18392b]" asChild><Link to="/signup">Join Naturelap</Link></Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="relative">
              <Menu className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#e97845]" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col gap-5 pt-10">
            <NavLinks />
            <Link to="/cart" className="flex items-center gap-2 text-sm font-medium">
              <ShoppingBag className="h-4 w-4" /> Cart ({cartCount})
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/profile" className="flex items-center gap-2 text-sm font-medium"><CircleUserRound className="h-4 w-4" /> Profile</Link>
                <Link to="/notifications" className="flex items-center gap-2 text-sm font-medium"><Bell className="h-4 w-4" /> Notifications ({unreadCount})</Link>
              </>
            )}
            <div className="mt-4 flex flex-col gap-2">
              {isAuthenticated ? (
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
              ) : (
                <>
                  <Button variant="outline" asChild><Link to="/login">Log in</Link></Button>
                  <Button asChild><Link to="/signup">Join Naturelap</Link></Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

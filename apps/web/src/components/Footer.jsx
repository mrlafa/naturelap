import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Mountain, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#10291f] py-14 text-white">
      <div className="container mx-auto grid grid-cols-1 gap-9 px-4 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-[#d5c895]" />
            <span className="font-serif text-xl font-bold">Naturelap</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/65">
            Stays, useful goods, and slower ways to discover Nepal.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-serif font-semibold text-[#d5c895]">Explore</h4>
          <ul className="space-y-2 text-sm text-white/65">
            <li><Link to="/feed" className="transition-colors hover:text-white">Discovery feed</Link></li>
            <li><Link to="/hostels" className="transition-colors hover:text-white">Find a stay</Link></li>
            <li><Link to="/store" className="transition-colors hover:text-white">Field shop</Link></li>
            <li><Link to="/about" className="transition-colors hover:text-white">About us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-serif font-semibold text-[#d5c895]">Account</h4>
          <ul className="space-y-2 text-sm text-white/65">
            <li><Link to="/login" className="transition-colors hover:text-white">Log in</Link></li>
            <li><Link to="/orders" className="transition-colors hover:text-white">Order history</Link></li>
            <li><Link to="/bookings" className="transition-colors hover:text-white">Booking history</Link></li>
            <li><Link to="/admin" className="transition-colors hover:text-white">Admin</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-serif font-semibold text-[#d5c895]">Contact</h4>
          <ul className="space-y-3 text-sm text-white/65">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Kathmandu, Nepal</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +977 1 234 5678</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@naturelap.com</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-12 border-t border-white/10 px-4 pt-8 text-center text-sm text-white/45">
        <p>&copy; {new Date().getFullYear()} Naturelap. Built close to the mountains.</p>
      </div>
    </footer>
  );
}

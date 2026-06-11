import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Mountain, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/commerce';

export default function HomePage() {
  const [stays, setStays] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      pb.collection('hostels').getList(1, 3, { sort: '-rating', $autoCancel: false }),
      pb.collection('products').getList(1, 4, { sort: '-created', $autoCancel: false }),
    ])
      .then(([stayResult, productResult]) => {
        setStays(stayResult.items);
        setProducts(productResult.items);
      })
      .catch((error) => {
        console.error(error);
        toast.error('Some featured content could not be loaded');
      });
  }, []);

  return (
    <div className="bg-[#f4f2eb]">
      <section className="relative min-h-[86vh] overflow-hidden bg-[#18392b]">
        <img
          src="https://images.unsplash.com/photo-1544735716-392fe2489ffa"
          alt="Himalayan mountain valley"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#10291f] via-[#18392b]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10291f]/70 via-transparent to-transparent" />

        <div className="container relative mx-auto flex min-h-[86vh] items-center px-4 py-24 text-white">
          <div className="max-w-4xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#e2d49d]">
              <Sparkles className="h-4 w-4" /> Find your way outside
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-[0.98] md:text-7xl lg:text-8xl">
              Stay close.<br />Travel lightly.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/75">
              Discover mountain stays, local provisions, and field-tested gear for a slower journey through Nepal.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full bg-[#e97845] px-7 text-white hover:bg-[#d96636]">
                <Link to="/feed">Explore the feed <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/35 bg-white/10 px-7 text-white backdrop-blur hover:bg-white/20 hover:text-white">
                <Link to="/hostels">Find a stay</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 right-7 hidden rounded-2xl border border-white/20 bg-black/20 p-4 text-sm text-white/75 backdrop-blur md:block">
          Curated in Kathmandu<br /><strong className="text-white">Made for the long way around</strong>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <PortalCard icon={Sparkles} eyebrow="Watch & discover" title="A vertical feed for your next idea" text="Move between stays and products, save what speaks to you, and act when you are ready." action="/feed" actionLabel="Open feed" />
          <PortalCard icon={Mountain} eyebrow="Sleep somewhere real" title="Mountain stays with a sense of place" text="Browse hostels, rooms, amenities, dates, and guest-ready booking totals." action="/hostels" actionLabel="Browse stays" />
          <PortalCard icon={ShoppingBag} eyebrow="Pack thoughtfully" title="Useful goods for the road" text="Local pantry, camp comfort, trail essentials, and weather-ready layers." action="/store" actionLabel="Visit store" />
        </div>
      </section>

      <section className="bg-[#fbfaf6] py-20">
        <div className="container mx-auto px-4">
          <div className="mb-9 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7a837c]">Stay awhile</p>
              <h2 className="mt-2 text-4xl font-semibold text-[#18392b]">Places worth waking up in.</h2>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/hostels">All stays <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {stays.map((stay) => (
              <Link key={stay.id} to={`/hostels/${stay.id}`} className="group overflow-hidden rounded-[2rem] bg-white shadow-sm">
                <div className="aspect-[4/3] overflow-hidden bg-[#e5e8e3]">
                  {stay.images?.length ? (
                    <img src={pb.files.getUrl(stay, stay.images[0])} alt={stay.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center"><Mountain className="h-10 w-10 text-[#8b968f]" /></div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-[#18392b]">{stay.name}</h3>
                    <span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-[#e5a33d] text-[#e5a33d]" /> {stay.rating}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#748078]"><MapPin className="h-4 w-4" /> {stay.location}</p>
                  <p className="mt-5 font-bold text-[#18392b]">{formatCurrency(stay.price_per_night)} <span className="text-sm font-normal text-[#7a837d]">/ night</span></p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="mb-9 flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7a837c]">Field shop</p>
            <h2 className="mt-2 text-4xl font-semibold text-[#18392b]">Pack less. Choose better.</h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/store">Shop everything <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="bg-[#d9cda1] px-4 py-16">
        <div className="container mx-auto flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#4c5c52]">One account, two kinds of journey</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#18392b]">Keep your bookings, orders, and saved finds together.</h2>
          </div>
          <Button asChild size="lg" className="rounded-full bg-[#18392b] px-7">
            <Link to="/signup">Create an account <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function PortalCard({ icon: Icon, eyebrow, title, text, action, actionLabel }) {
  return (
    <Card className="rounded-[2rem] border-0 bg-white shadow-sm">
      <CardContent className="p-7">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#edf2ed]">
          <Icon className="h-5 w-5 text-[#18392b]" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#8a928c]">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#18392b]">{title}</h2>
        <p className="mt-4 leading-7 text-[#6c776e]">{text}</p>
        <Button asChild variant="ghost" className="mt-5 -ml-3 text-[#18392b]">
          <Link to={action}>{actionLabel} <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}

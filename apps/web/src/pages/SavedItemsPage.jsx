import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, MapPin, Mountain, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useCommerce } from '@/contexts/CommerceContext';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/commerce';

export default function SavedItemsPage() {
  const { savedItems } = useCommerce();
  const [products, setProducts] = useState([]);
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);

  const productIds = useMemo(() => savedItems.filter((key) => key.startsWith('product:')).map((key) => key.slice(8)), [savedItems]);
  const stayIds = useMemo(() => savedItems.filter((key) => key.startsWith('stay:')).map((key) => key.slice(5)), [savedItems]);

  useEffect(() => {
    const loadSavedItems = async () => {
      setLoading(true);
      const [productResults, stayResults] = await Promise.all([
        Promise.all(productIds.map((id) => pb.collection('products').getOne(id, { $autoCancel: false }).catch(() => null))),
        Promise.all(stayIds.map((id) => pb.collection('hostels').getOne(id, { $autoCancel: false }).catch(() => null))),
      ]);
      setProducts(productResults.filter(Boolean));
      setStays(stayResults.filter(Boolean));
      setLoading(false);
    };
    loadSavedItems();
  }, [productIds.join(','), stayIds.join(',')]);

  return (
    <div className="min-h-screen bg-[#f4f2eb] px-4 py-10 md:py-16">
      <div className="container mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7b857d]">Your account</p>
        <h1 className="mt-2 text-4xl font-semibold text-[#18392b]">Saved finds</h1>
        <p className="mt-3 max-w-xl text-[#6d786f]">Stays and products you bookmarked from the feed and store.</p>

        {loading ? (
          <p className="mt-10 text-[#6d786f]">Loading saved items...</p>
        ) : savedItems.length === 0 ? (
          <div className="mt-10 rounded-[2rem] bg-white p-12 text-center shadow-sm">
            <Bookmark className="mx-auto h-9 w-9 text-[#18392b]" />
            <h2 className="mt-5 text-2xl font-semibold text-[#18392b]">Nothing saved yet</h2>
            <p className="mt-2 text-[#728078]">The discovery feed is a good place to begin.</p>
            <Button asChild className="mt-6 rounded-full"><Link to="/feed">Open the feed</Link></Button>
          </div>
        ) : (
          <>
            {stays.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-semibold text-[#18392b]">Saved stays</h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {stays.map((stay) => (
                    <Link key={stay.id} to={`/hostels/${stay.id}`}>
                      <Card className="group overflow-hidden rounded-[2rem] border-0 shadow-sm">
                        <div className="aspect-[4/3] overflow-hidden bg-[#e7ebe7]">
                          {stay.images?.length ? (
                            <img src={pb.files.getURL(stay, stay.images[0])} alt={stay.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="grid h-full place-items-center"><Mountain className="h-10 w-10 text-[#7f8c84]" /></div>
                          )}
                        </div>
                        <CardContent className="p-6">
                          <div className="flex justify-between gap-3">
                            <h3 className="text-xl font-semibold text-[#18392b]">{stay.name}</h3>
                            <span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-[#e5a33d] text-[#e5a33d]" /> {stay.rating}</span>
                          </div>
                          <p className="mt-2 flex items-center gap-2 text-sm text-[#758179]"><MapPin className="h-4 w-4" /> {stay.location}</p>
                          <p className="mt-5 font-bold text-[#18392b]">{formatCurrency(stay.price_per_night)} / night</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {products.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-semibold text-[#18392b]">Saved products</h2>
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {products.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

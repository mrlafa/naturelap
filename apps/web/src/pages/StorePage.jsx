import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStore = async () => {
      try {
        const [productResult, categoryResult] = await Promise.all([
          pb.collection('products').getList(1, 100, { sort: '-created', $autoCancel: false }),
          pb.collection('product_categories').getList(1, 50, { sort: 'sort_order', $autoCancel: false }),
        ]);
        setProducts(productResult.items);
        setCategories(categoryResult.items);
      } catch (error) {
        console.error(error);
        toast.error('Could not load the store');
      } finally {
        setLoading(false);
      }
    };
    loadStore();
  }, []);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesSearch = `${product.name} ${product.short_description}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesSearch && (category === 'all' || product.category_id === category);
    });

    return [...result].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'rating') return b.rating - a.rating;
      return Number(b.featured) - Number(a.featured);
    });
  }, [products, search, category, sort]);

  return (
    <div className="min-h-screen bg-[#f4f2eb]">
      <section className="overflow-hidden bg-[#18392b] px-4 py-16 text-white md:py-24">
        <div className="container mx-auto">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[#d5c895]">Naturelap Field Shop</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Useful things for going farther and staying longer.
          </h1>
          <p className="mt-5 max-w-xl text-white/70">
            Trail-tested essentials, local pantry finds, and quiet camp comforts selected in Nepal.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="mb-10 flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#788079]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              className="h-11 rounded-full border-0 bg-[#f4f2eb] pl-11"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 rounded-full md:w-56">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-11 rounded-full md:w-48">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
              <SelectItem value="price-low">Price: low to high</SelectItem>
              <SelectItem value="price-high">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="hidden h-11 w-11 rounded-full md:inline-flex">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm text-[#7a817b]">Curated collection</p>
            <h2 className="text-2xl font-semibold text-[#18392b]">{filteredProducts.length} products</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-[4/5] rounded-2xl" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </div>
  );
}

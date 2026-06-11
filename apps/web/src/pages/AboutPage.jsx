import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Leaf, Mountain, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const values = [
  { icon: Compass, title: 'Go with curiosity', text: 'We surface stays and objects that make thoughtful travel easier.' },
  { icon: Leaf, title: 'Choose a lighter footprint', text: 'Local partners, practical gear, and fewer disposable choices.' },
  { icon: Users, title: 'Keep value close', text: 'We want more travel spending to stay with hosts, makers, and communities.' },
];

export default function AboutPage() {
  return (
    <div className="bg-[#f4f2eb]">
      <section className="relative min-h-[72vh] overflow-hidden bg-[#18392b]">
        <img
          src="https://images.unsplash.com/photo-1544735716-392fe2489ffa"
          alt="Mountain landscape in Nepal"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#18392b] via-[#18392b]/75 to-transparent" />
        <div className="container relative mx-auto flex min-h-[72vh] items-center px-4 py-20 text-white">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d5c895]">About Naturelap</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] md:text-7xl">
              The good part of travel starts when you slow down.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
              Naturelap brings mountain stays, local goods, and useful field gear into one calm place for discovering Nepal.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Mountain className="h-10 w-10 text-[#e97845]" />
            <h2 className="mt-6 text-4xl font-semibold leading-tight text-[#18392b]">Built for a closer relationship with place.</h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-[#657168]">
            <p>Naturelap began with a simple booking idea and grew into a broader travel marketplace: discover a stay, learn from the landscape, and take home something useful or locally made.</p>
            <p>Our product is still growing, but the direction is clear: less noise, better choices, and experiences that feel grounded rather than extracted.</p>
          </div>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-[2rem] bg-white p-7 shadow-sm">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#edf2ed]">
                <Icon className="h-5 w-5 text-[#18392b]" />
              </span>
              <h3 className="mt-6 text-xl font-semibold text-[#18392b]">{title}</h3>
              <p className="mt-3 leading-7 text-[#6c776e]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#d9cda1] px-4 py-16">
        <div className="container mx-auto flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#4c5c52]">Start somewhere beautiful</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#18392b]">Find your next stay or field companion.</h2>
          </div>
          <Button asChild size="lg" className="rounded-full bg-[#18392b] px-7">
            <Link to="/feed">Explore Naturelap <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

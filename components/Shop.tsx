import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Apple,
  ArrowRight,
  Glasses,
  PackageCheck,
  Plus,
  Shirt,
  Sparkles,
  TabletSmartphone,
  Truck,
} from 'lucide-react';
import { CHOCOLATE_GALLERY_IMAGES, CHOCOLATE_LABEL, PRODUCTS } from '../constants';
import { Product } from '../types';

interface ShopProps {
  addToCart: (item: Product) => void;
}

type ProductCategory = Product['category'];

type ShopCollection = {
  id: 'food' | 'biohacking' | 'merch' | 'gadgets';
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  categories: ProductCategory[];
  icon: React.ReactNode;
};

const collections: ShopCollection[] = [
  {
    id: 'food',
    label: 'Food',
    eyebrow: 'Pantry',
    title: 'Chocolate, Sweeteners, Snacks',
    description: 'Blank@TS, BLANK ZERO, brown sugar, and clean popcorn stay together in one food-first shelf.',
    categories: ['chocolate', 'ingredient', 'snack'],
    icon: <Apple size={16} />,
  },
  {
    id: 'biohacking',
    label: 'Biohacking',
    eyebrow: 'Light & Recovery',
    title: 'Circadian Tools',
    description: 'Glasses and LLLT gear are separated from pantry items so product images feel intentional.',
    categories: ['biohacking'],
    icon: <Glasses size={16} />,
  },
  {
    id: 'merch',
    label: 'Merch',
    eyebrow: 'Wear',
    title: 'BLANK Merchandise',
    description: 'Apparel gets its own clean shelf instead of being buried next to snacks and gadgets.',
    categories: ['merch'],
    icon: <Shirt size={16} />,
  },
  {
    id: 'gadgets',
    label: 'Gadgets',
    eyebrow: 'BIGME',
    title: 'E-Ink Devices',
    description: 'Phones, tablets, monitors, and device accessories live in the dedicated BIGME catalog.',
    categories: ['gadget'],
    icon: <TabletSmartphone size={16} />,
  },
];

const categoryLabels: Record<ProductCategory, string> = {
  biohacking: 'Biohacking',
  chocolate: 'Chocolate',
  gadget: 'Gadget',
  ingredient: 'Ingredient',
  kit: 'Kit',
  merch: 'Merch',
  snack: 'Snack',
  tool: 'Tool',
  'nature-aligned': 'Nature Tool',
};

const Shop: React.FC<ShopProps> = ({ addToCart }) => {
  const [activeCollectionId, setActiveCollectionId] = useState<ShopCollection['id']>('food');
  const activeCollection = collections.find((collection) => collection.id === activeCollectionId) ?? collections[0];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const filteredProducts = PRODUCTS.filter((product) => {
    if (product.isBigme) return false;
    return activeCollection.categories.includes(product.category);
  });

  const productCount = filteredProducts.length + (activeCollection.id === 'gadgets' ? 1 : 0);
  const signatureChocolate = PRODUCTS.find((product) => product.id === 'blank-ts-signature') ?? PRODUCTS[0];

  return (
    <div className="relative mx-auto min-h-screen max-w-7xl overflow-hidden px-4 pb-12 pt-24 sm:px-6 md:pb-24 md:pt-32">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -right-28 top-8 h-72 w-72 rounded-full bg-cocoa-200/30 blur-[90px] dark:bg-cocoa-900/20" />
        <div className="absolute -left-24 bottom-20 h-80 w-80 rounded-full bg-amber-100/40 blur-[100px] dark:bg-amber-900/10" />
      </div>

      <section className="grid gap-5 rounded-[2rem] border border-cocoa-100 bg-white/70 p-5 shadow-[0_20px_70px_-45px_rgba(43,33,27,0.55)] backdrop-blur-xl dark:border-cocoa-800 dark:bg-cocoa-950/55 md:grid-cols-[1fr,auto] md:items-end md:rounded-[3rem] md:p-8">
        <div>
          <motion.span
            key={activeCollection.eyebrow}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex rounded-full bg-cocoa-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white dark:bg-white dark:text-cocoa-950"
          >
            {activeCollection.eyebrow}
          </motion.span>
          <motion.h2
            key={activeCollection.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 max-w-3xl font-serif text-4xl leading-[0.95] tracking-tight text-cocoa-950 dark:text-white sm:text-5xl md:text-7xl"
          >
            {activeCollection.title}
          </motion.h2>
          <motion.p
            key={activeCollection.description}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 max-w-2xl text-sm leading-relaxed text-cocoa-600 dark:text-cocoa-300 md:text-lg"
          >
            {activeCollection.description}
          </motion.p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-3xl bg-cocoa-50 p-3 text-center dark:bg-cocoa-900/70 md:w-72">
          <div>
            <div className="font-serif text-2xl text-cocoa-950 dark:text-white">{productCount}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-cocoa-500">Items</div>
          </div>
          <div>
            <div className="font-serif text-2xl text-cocoa-950 dark:text-white">4</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-cocoa-500">Shelves</div>
          </div>
          <div>
            <div className="font-serif text-2xl text-cocoa-950 dark:text-white">0</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-cocoa-500">Mixups</div>
          </div>
        </div>
      </section>

      <div className="sticky top-20 z-30 -mx-4 mt-4 border-y border-cocoa-100 bg-cream/90 px-4 py-3 backdrop-blur-xl dark:border-cocoa-800 dark:bg-cocoa-950/90 md:static md:mx-0 md:mt-8 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
          {collections.map((collection) => {
            const isActive = activeCollection.id === collection.id;
            return (
              <button
                key={collection.id}
                onClick={() => setActiveCollectionId(collection.id)}
                className={`flex min-w-[9.5rem] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 md:min-w-0 ${
                  isActive
                    ? 'border-cocoa-900 bg-cocoa-900 text-white shadow-xl shadow-cocoa-900/15 dark:border-white dark:bg-white dark:text-cocoa-950'
                    : 'border-cocoa-100 bg-white/70 text-cocoa-700 hover:border-cocoa-300 hover:bg-white dark:border-cocoa-800 dark:bg-cocoa-900/50 dark:text-cocoa-200 dark:hover:border-cocoa-600'
                }`}
              >
                <span className={`rounded-full p-2 ${isActive ? 'bg-white/15 dark:bg-cocoa-950/10' : 'bg-cocoa-100 dark:bg-cocoa-800'}`}>
                  {collection.icon}
                </span>
                <span>
                  <span className="block text-sm font-bold">{collection.label}</span>
                  <span className={`block text-[10px] uppercase tracking-widest ${isActive ? 'text-white/65 dark:text-cocoa-600' : 'text-cocoa-400'}`}>
                    {collection.eyebrow}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div layout className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:mt-10 md:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, index) => (
            <motion.article
              key={product.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.35, delay: index * 0.035 }}
              className="group grid grid-cols-[7.5rem,1fr] overflow-hidden rounded-[1.75rem] border border-cocoa-100 bg-white shadow-[0_16px_50px_-35px_rgba(43,33,27,0.45)] dark:border-cocoa-800 dark:bg-cocoa-900/80 sm:block md:rounded-[2.25rem]"
            >
              <div className="relative flex min-h-40 items-center justify-center bg-gradient-to-br from-cocoa-50 to-white p-3 dark:from-cocoa-950 dark:to-cocoa-900 sm:aspect-[1.08/1] sm:min-h-0 sm:p-5">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-full max-h-48 w-full object-contain transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-cocoa-800 shadow-sm dark:bg-cocoa-900/90 dark:text-cocoa-100">
                  {categoryLabels[product.category]}
                </span>
              </div>

              <div className="flex min-w-0 flex-col p-4 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-xl leading-tight text-cocoa-950 dark:text-white md:text-2xl">
                    {product.name}
                  </h3>
                  <div className="shrink-0 rounded-xl bg-cocoa-50 px-2.5 py-1 font-serif text-base text-cocoa-950 dark:bg-cocoa-950 dark:text-white md:text-lg">
                    {formatPrice(product.price)}
                  </div>
                </div>

                {product.description && (
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-cocoa-500 dark:text-cocoa-400 md:text-sm">
                    {product.description}
                  </p>
                )}

                <div className="mt-4 space-y-1.5 border-t border-cocoa-100 pt-3 text-[11px] text-cocoa-500 dark:border-cocoa-800 dark:text-cocoa-400">
                  {product.meta && (
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} />
                      <span>{product.meta}</span>
                    </div>
                  )}
                  {product.note && (
                    <div className="flex items-start gap-2">
                      <PackageCheck size={12} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{product.note}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Truck size={12} />
                    <span>Ships from BLANK</span>
                  </div>
                </div>

                <button
                  onClick={() => addToCart(product)}
                  className="mt-auto flex w-full items-center justify-center rounded-2xl bg-cocoa-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-cocoa-900/10 transition-all hover:bg-black active:scale-95 dark:bg-white dark:text-cocoa-950 dark:hover:bg-cocoa-100"
                >
                  <Plus size={16} className="mr-2" />
                  Add
                </button>
              </div>
            </motion.article>
          ))}

          {activeCollection.id === 'gadgets' && (
            <motion.article
              key="bigme-gadget-portal"
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="relative overflow-hidden rounded-[2rem] bg-cocoa-950 p-6 text-white shadow-2xl sm:col-span-2 lg:col-span-3"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(217,119,6,0.28),transparent_26%)]" />
              <div className="relative grid gap-6 md:grid-cols-[1fr,0.8fr] md:items-center">
                <div>
                  <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-200">
                    Devices / Gadgets
                  </span>
                  <h3 className="mt-4 font-serif text-4xl leading-none md:text-6xl">
                    BIGME gets a dedicated room.
                  </h3>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-cocoa-200 md:text-base">
                    E-ink phones, tablets, monitors, and accessories are no longer mixed with chocolate, sweeteners, popcorn, or merch.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-black/20 p-3">
                      <div className="font-serif text-2xl">E-Ink</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-cocoa-300">Displays</div>
                    </div>
                    <div className="rounded-2xl bg-black/20 p-3">
                      <div className="font-serif text-2xl">5G</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-cocoa-300">Phones</div>
                    </div>
                    <div className="rounded-2xl bg-black/20 p-3">
                      <div className="font-serif text-2xl">Android</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-cocoa-300">Tablets</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      window.location.hash = '#bigme';
                    }}
                    className="mt-4 flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-bold uppercase tracking-wider text-cocoa-950 transition-all hover:bg-cocoa-100 active:scale-95"
                  >
                    Open BIGME Catalog
                    <ArrowRight size={17} className="ml-2" />
                  </button>
                </div>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </motion.div>

      {activeCollection.id === 'food' && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-8 hidden overflow-hidden rounded-[3rem] bg-gradient-to-br from-cocoa-950 to-black p-10 text-white shadow-2xl md:block lg:p-16"
        >
          <div className="grid items-center gap-12 lg:grid-cols-[0.95fr,1fr]">
            <div>
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-amber-200">
                Signature Blend
              </span>
              <h3 className="mt-6 font-serif text-5xl leading-none tracking-tight lg:text-7xl">
                {CHOCOLATE_LABEL.name}
              </h3>
              <p className="mt-6 text-lg leading-relaxed text-cocoa-200">
                Crafted with {CHOCOLATE_LABEL.ingredients.slice(0, 3).join(', ')} and monk fruit sweetness. Food items now stay in the food shelf.
              </p>
              <button
                onClick={() => addToCart(signatureChocolate)}
                className="mt-8 rounded-2xl bg-white px-8 py-4 text-sm font-bold uppercase tracking-widest text-cocoa-950 transition-all hover:bg-cocoa-100 active:scale-95"
              >
                Order Signature Chocolate
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {CHOCOLATE_GALLERY_IMAGES.slice(0, 4).map((img, index) => (
                <motion.div
                  key={img.src}
                  whileHover={{ y: -8 }}
                  className={`aspect-[3/4] overflow-hidden rounded-3xl border border-white/10 shadow-2xl ${index % 2 ? 'mt-8' : ''}`}
                >
                  <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      <section className="mt-8 rounded-[2rem] border border-cocoa-100 bg-white/65 p-5 text-center backdrop-blur dark:border-cocoa-800 dark:bg-cocoa-900/45 md:mt-12 md:p-8">
        <h4 className="font-serif text-2xl text-cocoa-950 dark:text-white md:text-3xl">Need a custom chocolate build?</h4>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-cocoa-500 dark:text-cocoa-400">
          Use Builder for custom chocolate. Use BIGME for devices. This shop keeps browsing paths separate.
        </p>
        <button
          onClick={() => {
            window.location.hash = '#builder';
          }}
          className="mt-5 rounded-full border-2 border-cocoa-900 px-8 py-3 text-xs font-bold uppercase tracking-widest text-cocoa-900 transition-all hover:bg-cocoa-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-cocoa-950"
        >
          Go to Builder
        </button>
      </section>
    </div>
  );
};

export default Shop;

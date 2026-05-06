import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { CHOCOLATE_GALLERY_IMAGES, CHOCOLATE_LABEL, FREE_SHIPPING_THRESHOLD, PRODUCTS, SITE_DETAILS } from '../constants';
import { Product } from '../types';

interface ShopProps {
  addToCart: (item: Product) => void;
}

const Shop: React.FC<ShopProps> = ({ addToCart }) => {
  const [activeCategory, setActiveCategory] = React.useState<string>('all');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'chocolate', label: 'Chocolate' },
    { id: 'nature-aligned', label: 'Nature Tools' },
    { id: 'ingredient', label: 'Ingredients' },
  ];

  const filteredProducts = activeCategory === 'all' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-serif mb-4 text-cocoa-900 dark:text-cocoa-50">
          {activeCategory === 'nature-aligned' ? 'Nature-Aligned Tools' : 'The Pantry'}
        </h2>
        <p className="text-cocoa-600 dark:text-cocoa-400 max-w-2xl mx-auto">
          {activeCategory === 'nature-aligned' 
            ? 'Cutting-edge tools designed to minimize the negative impacts of modern technology and align with nature.'
            : 'Premium individual ingredients, professional molds, and complete kits for the at-home chocolatier.'}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === cat.id
                ? 'bg-cocoa-900 text-cream dark:bg-cocoa-100 dark:text-cocoa-900 shadow-md'
                : 'bg-white text-cocoa-600 hover:bg-cocoa-50 dark:bg-cocoa-800 dark:text-cocoa-300 dark:hover:bg-cocoa-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Chocolate Specific Section (Only show for 'all' or 'chocolate') */}
      {(activeCategory === 'all' || activeCategory === 'chocolate') && (
        <div className="mb-16 rounded-3xl border border-cocoa-200 dark:border-cocoa-800 bg-white/80 dark:bg-cocoa-900/70 p-8 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-cocoa-400 mb-3">Product Details</p>
              <h3 className="font-serif text-3xl text-cocoa-900 dark:text-cocoa-50 mb-3">{CHOCOLATE_LABEL.name}</h3>
              <p className="text-cocoa-600 dark:text-cocoa-300 leading-relaxed">
                Ingredients: {CHOCOLATE_LABEL.ingredients.join(', ')}.
              </p>
              <p className="mt-4 text-sm text-cocoa-500 dark:text-cocoa-400">
                Order support: {SITE_DETAILS.phone} · {SITE_DETAILS.email}
              </p>
              <div className="mt-4 inline-flex rounded-full bg-cocoa-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white dark:bg-cocoa-100 dark:text-cocoa-900">
                Free shipping above ₹{FREE_SHIPPING_THRESHOLD}
              </div>
            </div>

            <div className="grid gap-3 text-sm text-cocoa-700 dark:text-cocoa-200 sm:grid-cols-2 lg:min-w-[320px]">
              <div className="rounded-2xl bg-cocoa-50 dark:bg-cocoa-950 px-4 py-3">
                <div className="text-cocoa-400 uppercase tracking-widest text-[11px] mb-1">MRP</div>
                <div className="font-medium">₹{CHOCOLATE_LABEL.mrp} / {CHOCOLATE_LABEL.unitLabel}</div>
              </div>
              <div className="rounded-2xl bg-cocoa-50 dark:bg-cocoa-950 px-4 py-3">
                <div className="text-cocoa-400 uppercase tracking-widest text-[11px] mb-1">Country of Origin</div>
                <div className="font-medium">{SITE_DETAILS.countryOfOrigin}</div>
              </div>
              <div className="rounded-2xl bg-cocoa-50 dark:bg-cocoa-950 px-4 py-3 sm:col-span-2">
                <div className="text-cocoa-400 uppercase tracking-widest text-[11px] mb-1">FSSAI License</div>
                <div className="font-medium">{SITE_DETAILS.fssaiLicense}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CHOCOLATE_GALLERY_IMAGES.map((image, index) => (
              <motion.div
                key={image.src}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="overflow-hidden rounded-2xl border border-cocoa-100 bg-cocoa-50 dark:border-cocoa-800 dark:bg-cocoa-950"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] text-cocoa-500 dark:text-cocoa-400">
                  {image.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-white dark:bg-cocoa-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
          >
            <div className="aspect-[4/5] overflow-hidden bg-cocoa-100 relative">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-cocoa-400 mb-1">{product.category.replace('-', ' ')}</p>
                  <h3 className="font-serif text-xl font-medium text-cocoa-900 dark:text-cocoa-100">{product.name}</h3>
                </div>
                <span className="font-serif text-lg text-cocoa-900 dark:text-cocoa-100">{formatPrice(product.price)}</span>
              </div>
              {product.description && (
                <p className="mt-2 text-sm leading-relaxed text-cocoa-600 dark:text-cocoa-300">
                  {product.description}
                </p>
              )}
              <div className="mt-3 space-y-1 text-sm text-cocoa-500 dark:text-cocoa-400">
                {product.meta && <p>{product.meta}</p>}
                {product.category === 'chocolate' || product.category === 'ingredient' ? (
                   <p>FSSAI {SITE_DETAILS.fssaiLicense}</p>
                ) : null}
                {product.note && <p>{product.note}</p>}
              </div>
              
              <button 
                onClick={() => addToCart(product)}
                className="w-full mt-4 py-3 border border-cocoa-200 dark:border-cocoa-700 rounded-xl flex items-center justify-center text-sm font-medium hover:bg-cocoa-900 hover:text-white dark:hover:bg-white dark:hover:text-cocoa-900 transition-colors group-hover:border-cocoa-900"
              >
                <Plus size={16} className="mr-2" /> Add to Cart
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Shop;

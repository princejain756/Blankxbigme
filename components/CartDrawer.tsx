import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from '../types';
import { FREE_SHIPPING_THRESHOLD } from '../constants';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, items, onRemove, onCheckout }) => {
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingQualified = total >= FREE_SHIPPING_THRESHOLD;
  const amountForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
    
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[70] grid h-[100dvh] max-h-[100dvh] w-full max-w-md grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden border-l border-cocoa-100 bg-cream shadow-2xl dark:border-cocoa-800 dark:bg-cocoa-950"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-cocoa-100 p-5 dark:border-cocoa-800 md:p-6">
              <h2 className="font-serif text-2xl">Your Bag</h2>
              <button onClick={onClose} className="p-2 hover:bg-cocoa-100 dark:hover:bg-cocoa-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 space-y-4 overflow-y-auto p-4 md:space-y-6 md:p-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-cocoa-400 space-y-4">
                  <span className="text-4xl">🍫</span>
                  <p>Your bag is empty.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[4.75rem,1fr,auto] gap-3 rounded-2xl bg-white/55 p-3 dark:bg-cocoa-900/55 md:grid-cols-[5rem,1fr,auto] md:gap-4">
                    <div className="h-[4.75rem] w-[4.75rem] flex-shrink-0 overflow-hidden rounded-xl bg-cocoa-100 md:h-20 md:w-20">
                      <img
                        src={item.product.image || 'https://images.unsplash.com/photo-1623259960243-7f722cb54a9d?auto=format&fit=crop&q=60&w=160'}
                        alt={item.product.name}
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="mb-1 line-clamp-2 font-serif text-base font-medium leading-tight md:text-lg">{item.product.name}</h4>
                      <p className="text-sm text-cocoa-500 mb-3">{formatPrice(item.product.price)}</p>
                      <div className="flex items-center gap-3">
                         <div className="flex items-center border border-cocoa-200 dark:border-cocoa-700 rounded-md">
                           <button className="p-1 hover:bg-cocoa-100 dark:hover:bg-cocoa-800"><Minus size={14} /></button>
                           <span className="px-2 text-sm">{item.quantity}</span>
                           <button className="p-1 hover:bg-cocoa-100 dark:hover:bg-cocoa-800"><Plus size={14} /></button>
                         </div>
                      </div>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="self-start rounded-full p-2 text-cocoa-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="shrink-0 border-t border-cocoa-100 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_36px_rgba(43,33,27,0.08)] backdrop-blur dark:border-cocoa-800 dark:bg-cocoa-900/90 md:p-6">
              <div className="mb-3 flex items-center justify-between text-lg font-medium">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-cocoa-500 dark:text-cocoa-400 md:text-sm">
                {shippingQualified
                  ? `Free shipping unlocked on this order.`
                  : `Free shipping above ₹${FREE_SHIPPING_THRESHOLD}. Add ${formatPrice(amountForFreeShipping)} more to qualify.`}
              </p>
              <button 
                onClick={onCheckout}
                className="min-h-12 w-full rounded-xl bg-cocoa-900 px-4 py-3 font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-cocoa-950"
                disabled={items.length === 0}
              >
                Proceed to Checkout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

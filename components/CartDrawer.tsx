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
            className="fixed inset-y-0 right-0 w-full max-w-md bg-cream dark:bg-cocoa-950 z-[70] shadow-2xl border-l border-cocoa-100 dark:border-cocoa-800 flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-cocoa-100 dark:border-cocoa-800">
              <h2 className="font-serif text-2xl">Your Bag</h2>
              <button onClick={onClose} className="p-2 hover:bg-cocoa-100 dark:hover:bg-cocoa-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-cocoa-400 space-y-4">
                  <span className="text-4xl">🍫</span>
                  <p>Your bag is empty.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 bg-cocoa-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.product.image || 'https://images.unsplash.com/photo-1623259960243-7f722cb54a9d?w=200'} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium font-serif text-lg leading-tight mb-1">{item.product.name}</h4>
                        <button onClick={() => onRemove(item.id)} className="text-cocoa-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-cocoa-500 mb-3">{formatPrice(item.product.price)}</p>
                      <div className="flex items-center gap-3">
                         <div className="flex items-center border border-cocoa-200 dark:border-cocoa-700 rounded-md">
                           <button className="p-1 hover:bg-cocoa-100 dark:hover:bg-cocoa-800"><Minus size={14} /></button>
                           <span className="px-2 text-sm">{item.quantity}</span>
                           <button className="p-1 hover:bg-cocoa-100 dark:hover:bg-cocoa-800"><Plus size={14} /></button>
                         </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="sticky bottom-0 border-t border-cocoa-100 bg-white/90 p-6 pb-8 backdrop-blur dark:border-cocoa-800 dark:bg-cocoa-900/80 md:pb-6">
              <div className="flex justify-between items-center mb-4 text-lg font-medium">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="mb-4 text-sm text-cocoa-500 dark:text-cocoa-400">
                {shippingQualified
                  ? `Free shipping unlocked on this order.`
                  : `Free shipping above ₹${FREE_SHIPPING_THRESHOLD}. Add ${formatPrice(amountForFreeShipping)} more to qualify.`}
              </p>
              <button 
                onClick={onCheckout}
                className="w-full py-4 bg-cocoa-900 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
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

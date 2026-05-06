import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Moon, Sun, Menu, X, Store, Hammer, TabletSmartphone, Truck } from 'lucide-react';
import { ViewState, CartItem, Product, Ingredient } from './types';
import Hero from './components/Hero';
import Builder from './components/Builder';
import Shop from './components/Shop';
import BigmeCollaboration from './components/BigmeCollaboration';
import OpenSource from './components/OpenSource';
import PolicyPage from './components/PolicyPage';
import CartDrawer from './components/CartDrawer';
import CheckoutPage from './components/CheckoutPage';
import OrderTrackingPage from './components/OrderTrackingPage';
import AdminPanelPage from './components/AdminPanelPage';
import { CHOCOLATE_LABEL, SITE_DETAILS } from './constants';
import fssaiLogo from './fssailogo.png';
import companyLogo from './logonobgSupercropped.png';

const CART_STORAGE_KEY = 'blank_cart_v1';

const parseHashRoute = (): { view: ViewState; bigmeHandle: string | null } => {
  const rawHash = window.location.hash.replace(/^#/, '').trim();

  if (rawHash.startsWith('bigme/')) {
    return {
      view: 'bigme',
      bigmeHandle: decodeURIComponent(rawHash.slice('bigme/'.length)) || null,
    };
  }

  if (rawHash === 'bigme') {
    return { view: 'bigme', bigmeHandle: null };
  }

  if (
    rawHash === 'shop' ||
    rawHash === 'builder' ||
    rawHash === 'opensource' ||
    rawHash === 'hero' ||
    rawHash === 'policy' ||
    rawHash === 'checkout' ||
    rawHash === 'track' ||
    rawHash === 'admin'
  ) {
    return { view: rawHash, bigmeHandle: null };
  }

  return { view: 'hero', bigmeHandle: null };
};

const App: React.FC = () => {
  const initialRoute = parseHashRoute();
  const [currentView, setCurrentView] = useState<ViewState>(initialRoute.view);
  const [selectedBigmeHandle, setSelectedBigmeHandle] = useState<string | null>(initialRoute.bigmeHandle);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Dark mode toggle effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (currentView === 'bigme') {
      document.title = selectedBigmeHandle
        ? 'BIGME x BLANK | Product'
        : 'BIGME x BLANK | BLANK';
      return;
    }

    if (currentView === 'checkout') {
      document.title = 'Checkout | BLANK';
      return;
    }

    if (currentView === 'track') {
      document.title = 'Track Order | BLANK';
      return;
    }

    if (currentView === 'admin') {
      document.title = 'Admin Orders | BLANK';
      return;
    }

    if (currentView === 'policy') {
      document.title = 'Warranty & Return Policy | BLANK';
      return;
    }

    document.title = 'BLANK | BIGME x BLANK';
  }, [currentView, selectedBigmeHandle]);

  useEffect(() => {
    const syncFromHash = () => {
      const route = parseHashRoute();
      setCurrentView(route.view);
      setSelectedBigmeHandle(route.bigmeHandle);
    };

    window.addEventListener('hashchange', syncFromHash);
    syncFromHash();

    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        setCart(parsed);
      }
    } catch {
      // Ignore corrupted cart state and continue with an empty cart.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage write failures (private mode/storage full).
    }
  }, [cart]);

  const addToCart = (item: Product | Ingredient) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, quantity: 1, product: item }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const addBigmeToCart = (item: Product) => {
    addToCart(item);
  };

  const buyNowBigme = (item: Product) => {
    setCart([{ id: item.id, quantity: 1, product: item }]);
    navigateTo('checkout', null);
  };

  const openCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    navigateTo('checkout', null);
  };

  const handleOrderPlaced = (_orderId: string) => {
    setCart([]);
  };

  const navItems = [
    { id: 'shop', label: 'Shop' },
    { id: 'builder', label: 'Builder' },
    { id: 'bigme', label: 'BIGME x BLANK' },
  ];

  const mobileNavItems: Array<{
    id: ViewState | 'cart';
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'shop', label: 'Shop', icon: <Store size={18} /> },
    { id: 'builder', label: 'Builder', icon: <Hammer size={18} /> },
    { id: 'bigme', label: 'Bigme', icon: <TabletSmartphone size={18} /> },
    { id: 'track', label: 'Track', icon: <Truck size={18} /> },
    { id: 'cart', label: 'Cart', icon: <ShoppingBag size={18} /> },
  ];

  const navigateTo = (view: ViewState, bigmeHandle?: string | null) => {
    const nextHash =
      view === 'bigme'
        ? bigmeHandle
          ? `bigme/${encodeURIComponent(bigmeHandle)}`
          : 'bigme'
        : view;

    if (window.location.hash.replace(/^#/, '') !== nextHash) {
      window.location.hash = nextHash;
    }

    setCurrentView(view);
    setSelectedBigmeHandle(view === 'bigme' ? bigmeHandle ?? null : null);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (view: ViewState) => {
    navigateTo(view, null);
  };

  const isMobileNavViewActive = (itemId: ViewState | 'cart') => {
    if (itemId === 'cart') return false;
    return currentView === itemId;
  };

  return (
    <div className={`min-h-screen relative font-sans selection:bg-cocoa-200 selection:text-cocoa-900 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 py-3 transition-all duration-300 md:px-6 md:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 shadow-lg shadow-cocoa-900/5 glass md:px-6">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('hero')} 
            className="cursor-pointer transition-opacity hover:opacity-80"
          >
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className="h-10 md:h-12 w-auto object-contain dark:brightness-0 dark:invert" 
            />
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as ViewState)}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                  currentView === item.id 
                    ? 'text-cocoa-800 dark:text-cocoa-100' 
                    : 'text-cocoa-500 hover:text-cocoa-800 dark:text-cocoa-400 dark:hover:text-cocoa-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:space-x-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-cocoa-100 dark:hover:bg-cocoa-800 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative rounded-full p-2 transition-colors hover:bg-cocoa-100 dark:hover:bg-cocoa-800"
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold text-white">
                  {cart.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-cocoa-100 dark:hover:bg-cocoa-800"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-cream dark:bg-cocoa-950 pt-24 px-6 md:hidden"
          >
             <div className="flex flex-col space-y-6 text-center">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as ViewState)}
                  className="text-3xl font-serif font-medium"
                >
                  {item.label}
                </button>
              ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="w-full min-h-screen bg-grain pb-24 md:pb-0 pt-0">
        <AnimatePresence mode="wait">
          {currentView === 'hero' && (
            <motion.div 
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Hero onStart={() => handleNavClick('builder')} onExplore={() => handleNavClick('shop')} />
            </motion.div>
          )}

          {currentView === 'builder' && (
            <motion.div 
              key="builder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Builder addToCart={addToCart} />
            </motion.div>
          )}

          {currentView === 'shop' && (
            <motion.div 
              key="shop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Shop addToCart={addToCart} />
            </motion.div>
          )}

          {currentView === 'opensource' && (
            <motion.div 
              key="opensource"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <OpenSource />
            </motion.div>
          )}

          {currentView === 'bigme' && (
            <motion.div 
              key="bigme"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BigmeCollaboration
                onBackToCatalog={() => navigateTo('bigme', null)}
                onAddToCart={addBigmeToCart}
                onBuyNow={buyNowBigme}
                onOpenProduct={(handle) => navigateTo('bigme', handle)}
                selectedHandle={selectedBigmeHandle}
              />
            </motion.div>
          )}

          {currentView === 'policy' && (
            <motion.div
              key="policy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PolicyPage onBack={() => handleNavClick('hero')} />
            </motion.div>
          )}

          {currentView === 'checkout' && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CheckoutPage
                items={cart}
                onBack={() => handleNavClick('shop')}
                onOrderPlaced={handleOrderPlaced}
              />
            </motion.div>
          )}

          {currentView === 'track' && (
            <motion.div
              key="track"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <OrderTrackingPage />
            </motion.div>
          )}

          {currentView === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AdminPanelPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-cocoa-200 bg-white/95 px-2 py-2 shadow-[0_-8px_32px_rgba(43,33,27,0.08)] backdrop-blur md:hidden dark:border-cocoa-800 dark:bg-cocoa-950/95">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {mobileNavItems.map((item) => {
            const isActive = isMobileNavViewActive(item.id);
            const commonClass = `flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[11px] font-medium transition-colors ${
              isActive
                ? 'bg-cocoa-900 text-white dark:bg-white dark:text-cocoa-950'
                : 'text-cocoa-600 hover:bg-cocoa-100 dark:text-cocoa-300 dark:hover:bg-cocoa-800'
            }`;

            if (item.id === 'cart') {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className={commonClass}
                >
                  <span className="relative">
                    {item.icon}
                    {cart.length > 0 && (
                      <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold text-white">
                        {cart.length}
                      </span>
                    )}
                  </span>
                  <span className="mt-1">{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id as ViewState)}
                className={commonClass}
              >
                {item.icon}
                <span className="mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart} 
        onRemove={removeFromCart} 
        onCheckout={openCheckout}
      />

      {/* Footer */}
      <footer className="w-full border-t border-cocoa-100 bg-white px-6 py-12 pb-24 dark:border-cocoa-800 dark:bg-cocoa-900/50 md:pb-12">
        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-[1.2fr,1fr,auto] text-sm text-cocoa-600 dark:text-cocoa-300">
          <div>
            <div 
              onClick={() => handleNavClick('hero')} 
              className="mb-4 cursor-pointer transition-opacity hover:opacity-80"
            >
              <img 
                src={companyLogo} 
                alt="Company Logo" 
                className="h-8 w-auto object-contain dark:brightness-0 dark:invert" 
              />
            </div>
            <p>
              High-performance living · Nature-aligned tools
            </p>
            <p className="mt-1">
              FSSAI Lic. No. {SITE_DETAILS.fssaiLicense} · Country of Origin: {SITE_DETAILS.countryOfOrigin}
            </p>
          </div>

          <div className="space-y-1">
            <a href={`mailto:${SITE_DETAILS.email}`} className="block hover:text-cocoa-900 dark:hover:text-white transition-colors">
              {SITE_DETAILS.email}
            </a>
            <a href={`tel:${SITE_DETAILS.phone.replace(/\s+/g, '')}`} className="block hover:text-cocoa-900 dark:hover:text-white transition-colors">
              {SITE_DETAILS.phone}
            </a>
            <a href={SITE_DETAILS.whatsappHref} target="_blank" rel="noreferrer" className="block hover:text-cocoa-900 dark:hover:text-white transition-colors">
              WhatsApp available on {SITE_DETAILS.whatsapp}
            </a>
            <button
              onClick={() => handleNavClick('policy')}
              className="block hover:text-cocoa-900 dark:hover:text-white transition-colors text-left"
            >
              Warranty &amp; Return Policy
            </button>
            <button
              onClick={() => handleNavClick('track')}
              className="block hover:text-cocoa-900 dark:hover:text-white transition-colors text-left"
            >
              Track Your Order
            </button>
            <button
              onClick={() => handleNavClick('admin')}
              className="block hover:text-cocoa-900 dark:hover:text-white transition-colors text-left"
            >
              Admin Panel
            </button>
          </div>

          <div className="flex items-center gap-3">
            <img src={fssaiLogo} alt="FSSAI logo" className="h-12 w-auto object-contain" />
            <div className="text-xs leading-relaxed">
              <div className="font-medium text-cocoa-900 dark:text-cocoa-100">FSSAI Registered</div>
              <div>{SITE_DETAILS.fssaiLicense}</div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;

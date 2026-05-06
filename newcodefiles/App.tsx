import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Moon, Sun, Menu, X, ArrowRight } from 'lucide-react';
import { ViewState, CartItem, Product, Ingredient } from './types';
import Hero from './components/Hero';
import Builder from './components/Builder';
import Shop from './components/Shop';
import BigmeCollaboration from './components/BigmeCollaboration';
import OpenSource from './components/OpenSource';
import PolicyPage from './components/PolicyPage';
import CartDrawer from './components/CartDrawer';
import { CHOCOLATE_LABEL, SITE_DETAILS } from './constants';
import fssaiLogo from './fssailogo.png';

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

  if (rawHash === 'shop' || rawHash === 'builder' || rawHash === 'opensource' || rawHash === 'hero' || rawHash === 'policy') {
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

  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'shop', label: 'Shop' },
    { id: 'bigme', label: 'BIGME x BLANK' },
    { id: 'builder', label: 'Builder' },
    { id: 'opensource', label: 'Open Source' },
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

  return (
    <div className={`min-h-screen relative font-sans selection:bg-cocoa-200 selection:text-cocoa-900 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between shadow-lg shadow-cocoa-900/5">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('hero')} 
            className="text-2xl font-serif font-bold tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
          >
            BLANK<span className="text-cocoa-400">.</span>
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
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-cocoa-100 dark:hover:bg-cocoa-800 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 relative rounded-full hover:bg-cocoa-100 dark:hover:bg-cocoa-800 transition-colors"
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
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
      <main className="w-full min-h-screen pt-0 bg-grain">
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
        </AnimatePresence>
      </main>

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart} 
        onRemove={removeFromCart} 
      />

      {/* Footer */}
      <footer className="w-full py-12 px-6 bg-white dark:bg-cocoa-900/50 border-t border-cocoa-100 dark:border-cocoa-800">
        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-[1.2fr,1fr,auto] text-sm text-cocoa-600 dark:text-cocoa-300">
          <div>
            <div className="mb-2 font-serif text-lg text-cocoa-900 dark:text-cocoa-100">
              &copy; 2024 BLANK.
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

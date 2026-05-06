import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MoveDown } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
  onExplore: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart, onExplore }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Background with parallax/animation effect simulation */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1606312619070-d48b706521bf?q=80&w=2070&auto=format&fit=crop" 
          alt="Melting Chocolate" 
          className="w-full h-full object-cover opacity-20 dark:opacity-10 scale-110 animate-float origin-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cream/50 to-cream dark:via-cocoa-950/50 dark:to-cocoa-950" />
      </div>

      {/* Floating Particles (Simulated) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-cocoa-400 opacity-30 blur-sm"
        />
        <motion.div 
          animate={{ y: [0, 30, 0], rotate: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-1/4 w-8 h-8 rounded-full bg-cocoa-600 opacity-20 blur-md"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block py-1 px-3 mb-6 rounded-full border border-cocoa-900/10 dark:border-white/10 text-xs tracking-[0.2em] uppercase font-semibold text-cocoa-600 dark:text-cocoa-300 backdrop-blur-sm">
            Est. 2024 &mdash; Open Source
          </span>
          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl leading-[0.9] font-medium text-cocoa-900 dark:text-cocoa-50 mb-6 tracking-tight text-shadow">
            Align with <br /> Nature.
          </h1>
          <p className="font-sans text-lg md:text-xl text-cocoa-600 dark:text-cocoa-300 max-w-lg mx-auto leading-relaxed mb-10">
            A platform for high-performance living. <br className="hidden md:block"/>
            From open-source craft chocolate to nature-aligned focus tools.
          </p>
        </motion.div>

        <motion.div 
          className="flex flex-col sm:flex-row gap-4 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <button 
            onClick={onStart}
            className="group relative px-8 py-4 bg-cocoa-900 text-cream rounded-full overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-cocoa-100 dark:text-cocoa-900"
          >
            <span className="relative z-10 flex items-center font-medium tracking-wide">
              Start Building <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-cocoa-800 dark:bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out" />
          </button>
          
          <button 
            onClick={onExplore}
            className="px-8 py-4 text-cocoa-900 dark:text-cocoa-100 font-medium tracking-wide hover:text-cocoa-600 dark:hover:text-cocoa-300 transition-colors"
          >
            Explore Ingredients
          </button>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-cocoa-400 dark:text-cocoa-600"
      >
        <MoveDown className="w-6 h-6 animate-bounce" />
      </motion.div>
    </div>
  );
};

export default Hero;
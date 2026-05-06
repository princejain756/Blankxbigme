import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, ChefHat, Play, ArrowRight, ArrowLeft, Beaker, Settings, Package, Sparkles } from 'lucide-react';
import { INGREDIENTS } from '../constants';
import { Ingredient } from '../types';

interface BuilderProps {
  addToCart: (item: any) => void;
}

type Step = 1 | 2 | 3 | 4;

const Builder: React.FC<BuilderProps> = ({ addToCart }) => {
  const [step, setStep] = useState<Step>(1);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [sweetness, setSweetness] = useState<number>(50);
  const [textureStyle, setTextureStyle] = useState<string>('Blankets™');

  const toggleIngredient = (id: string) => {
    setSelectedIngredients(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4) as Step);
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1) as Step);
  const addCustomKit = () => {
    addToCart({
      id: `custom-kit-${Date.now()}`,
      name: `Custom BLANK Kit (${textureStyle})`,
      price: 3500,
      image: 'https://images.unsplash.com/photo-1623259960243-7f722cb54a9d?auto=format&fit=crop&q=80&w=800',
      category: 'kit',
      note: `${sweetness}% sweetness, ${selectedIngredients.length} ingredients`,
    });
  };

  // --- Sub-Components for Steps ---

  const StepOneIngredients = () => (
    <div className="grid grid-cols-2 gap-3 pb-28 sm:grid-cols-2 md:grid-cols-3 md:gap-6 md:pb-10">
      {INGREDIENTS.map((ing) => {
        const isSelected = selectedIngredients.includes(ing.id);
        return (
          <motion.div
            key={ing.id}
            layoutId={ing.id}
            onClick={() => toggleIngredient(ing.id)}
            whileHover={{ y: -3 }}
            className={`group relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-500 md:rounded-[2rem] md:p-7 ${
              isSelected 
                ? 'bg-white dark:bg-cocoa-800 border-cocoa-900 dark:border-cocoa-100 shadow-2xl scale-[1.02]' 
                : 'bg-white/40 dark:bg-cocoa-900/40 border-transparent hover:border-cocoa-200 dark:hover:border-cocoa-700 shadow-sm'
            }`}
          >
            <div className="mb-4 flex items-start justify-between md:mb-6">
              <div 
                className="h-12 w-12 rounded-2xl shadow-inner rotate-3 transition-transform duration-500 group-hover:rotate-6 md:h-16 md:w-16 md:rounded-3xl"
                style={{ backgroundColor: ing.color }} 
              />
              <AnimatePresence>
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -45 }}
                    className="rounded-full bg-cocoa-900 p-1.5 text-white dark:bg-white dark:text-cocoa-900 md:p-2"
                  >
                    <Check size={16} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] font-serif text-base font-medium leading-tight text-cocoa-900 dark:text-cocoa-50 md:mb-2 md:min-h-0 md:text-2xl">{ing.name}</h3>
            <p className="mb-4 hidden text-sm font-light leading-relaxed text-cocoa-600 dark:text-cocoa-400 sm:line-clamp-2 sm:block md:mb-6">{ing.description}</p>
            <div className="mt-auto flex flex-wrap gap-1.5 md:gap-2">
              {ing.badges.map(badge => (
                <span key={badge} className="rounded-full border border-cocoa-100 bg-cocoa-50 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-cocoa-500 dark:border-cocoa-600 dark:bg-cocoa-700/50 dark:text-cocoa-300 md:px-3 md:py-1.5 md:text-[9px]">
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const StepTwoSweetness = () => {
    const getSweetnessLabel = (val: number) => {
      if (val < 25) return "Intense Dark & Bold";
      if (val < 50) return "Balanced Cacao Profile";
      if (val < 75) return "Smooth & Sweet Indulgence";
      return "Maximum Sweetness Mode";
    };

    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/20 bg-white/30 px-4 py-8 backdrop-blur-sm dark:bg-cocoa-900/30 md:rounded-[3rem] md:py-16">
        <h3 className="mb-3 text-center font-serif text-3xl md:text-4xl">Define Your Profile</h3>
        <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-cocoa-500 dark:text-cocoa-400 md:mb-12 md:text-base">The sweetness ratio defines the flavor release of your custom bar.</p>
        
        <div className="relative mb-8 w-full max-w-2xl px-2 md:mb-12 md:px-10">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={sweetness}
            onChange={(e) => setSweetness(parseInt(e.target.value))}
            className="w-full h-3 bg-cocoa-100 dark:bg-cocoa-800 rounded-full appearance-none cursor-pointer accent-cocoa-900 dark:accent-white"
          />
          <div className="mt-4 flex justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-cocoa-400 md:mt-6 md:text-[10px] md:tracking-[0.3em]">
            <span>Raw</span>
            <span>Optimal</span>
            <span>Dessert</span>
          </div>
        </div>

        <motion.div 
          key={sweetness}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mb-2 font-serif text-6xl tracking-tighter text-cocoa-900 dark:text-cocoa-100 md:mb-4 md:text-8xl">
            {sweetness}<span className="text-3xl text-cocoa-300 dark:text-cocoa-600 md:text-4xl">%</span>
          </div>
          <div className="font-serif text-lg italic text-cocoa-600 dark:text-cocoa-300 md:text-xl">
            {getSweetnessLabel(sweetness)}
          </div>
        </motion.div>
        
        <div className="glass mt-8 w-full max-w-lg rounded-3xl border border-white/10 p-5 text-center shadow-inner md:mt-12 md:p-8">
            <p className="text-sm italic leading-relaxed text-cocoa-500 dark:text-cocoa-400">
                "At {sweetness}%, the molecular structure {sweetness > 50 ? 'leans towards rapid melt-away texture' : 'retains the complex phenolic compounds of the cacao base'}."
            </p>
        </div>
      </div>
    );
  };

  const StepThreeTexture = () => {
    const styles = [
      { name: 'Blankets™', desc: 'Curated Soft Edges', shape: 'rounded-[2rem]' },
      { name: 'Blank Bites™', desc: 'Precision Geometric Snap', shape: 'rounded-md' },
      { name: 'Blank Crunch™', desc: 'High-Surface Area Grid', shape: 'rounded-none border-4 border-dashed border-cocoa-200 dark:border-cocoa-700' },
      { name: 'Blank Melt™', desc: 'Organic Flow Form', shape: 'rounded-[3rem] rotate-12' },
    ];

    return (
      <div className="grid grid-cols-1 gap-3 pb-28 md:grid-cols-2 md:gap-6 md:py-8 md:pb-10">
        {styles.map((style) => (
          <motion.button
            key={style.name}
            onClick={() => setTextureStyle(style.name)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center rounded-2xl border-2 p-4 text-left transition-all duration-500 md:rounded-[2.5rem] md:p-8 ${
              textureStyle === style.name 
                ? 'border-cocoa-900 bg-white dark:bg-cocoa-800 dark:border-white shadow-2xl' 
                : 'border-transparent bg-white/40 dark:bg-cocoa-900/40 hover:bg-white hover:shadow-lg dark:hover:bg-cocoa-800'
            }`}
          >
            <div className={`mr-4 h-20 w-16 flex-shrink-0 bg-gradient-to-br from-cocoa-800 to-black shadow-2xl transition-all duration-500 md:mr-8 md:h-32 md:w-24 ${style.shape} ${textureStyle === style.name ? 'scale-105 shadow-cocoa-900/40 md:scale-110' : ''}`} />
            <div>
              <h4 className="mb-1 font-serif text-xl font-medium text-cocoa-900 dark:text-white md:mb-2 md:text-2xl">{style.name}</h4>
              <p className="text-sm leading-relaxed text-cocoa-500 dark:text-cocoa-400">{style.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    );
  };

  const StepFourAssembly = () => (
    <div className="mx-auto max-w-5xl pb-28 md:py-8 md:pb-10">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="mb-4 inline-block rounded-full bg-cocoa-900 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white dark:bg-white dark:text-cocoa-900 md:mb-6">Final Configuration</span>
          <h3 className="mb-4 font-serif text-4xl leading-tight md:mb-6 md:text-6xl">Your Studio Kit is Ready.</h3>
          <p className="mb-6 text-base leading-relaxed text-cocoa-600 dark:text-cocoa-400 md:mb-8 md:text-lg">
            You've engineered a custom blend with {selectedIngredients.length} ingredients at {sweetness}% sweetness, optimized for the {textureStyle} form factor.
          </p>
          
          <div className="mb-8 grid gap-3 sm:grid-cols-2 md:mb-10">
            {[
              "Thermal modulation at 45°C",
              "Precision crystal seeding",
              "Agitation & Homogenization",
              "Flash cooling in custom mold"
            ].map((step, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="group flex items-center gap-3 rounded-2xl bg-white/45 p-3 dark:bg-cocoa-900/45"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cocoa-100 text-[10px] font-bold text-cocoa-900 transition-colors group-hover:bg-cocoa-900 group-hover:text-white dark:bg-cocoa-800 dark:text-white">
                  0{i + 1}
                </span>
                <span className="text-sm tracking-wide text-cocoa-700 dark:text-cocoa-200">{step}</span>
              </motion.div>
            ))}
          </div>

          <button 
            onClick={addCustomKit}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-cocoa-900 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-2xl transition-all hover:bg-black active:scale-95 dark:bg-white dark:text-cocoa-900 dark:hover:bg-cocoa-100 md:w-auto md:px-12 md:py-5"
          >
            Deploy Custom Kit - ₹3,500 <Sparkles size={18} />
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1 }}
          className="group relative hidden aspect-square overflow-hidden rounded-[3rem] shadow-2xl md:block"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cocoa-900/40 to-transparent z-10 group-hover:opacity-0 transition-opacity duration-700" />
          <img 
            src="https://images.unsplash.com/photo-1623259960243-7f722cb54a9d?auto=format&fit=crop&q=80&w=1200" 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] ease-out" 
            alt="Custom Kit Experience"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
             <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-700">
                <ChefHat size={48} className="text-white" />
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto min-h-screen max-w-7xl overflow-hidden px-4 pb-44 pt-24 sm:px-6 md:pb-32 md:pt-32">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-red-100/30 blur-[120px] rounded-full dark:bg-red-900/5" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-cocoa-100/50 blur-[120px] rounded-full dark:bg-cocoa-900/10" />
      </div>

      {/* Progress Header */}
      <div className="mb-8 flex flex-col justify-between gap-5 md:mb-14 md:flex-row md:items-end md:gap-8">
        <div>
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.32em] text-cocoa-400 md:text-xs md:tracking-[0.4em]">The Laboratory</span>
          <h2 className="font-serif text-5xl tracking-tighter text-cocoa-900 dark:text-cocoa-50 md:text-8xl">Studio<span className="text-cocoa-300">.</span></h2>
        </div>
        
        <div className="flex flex-col items-start gap-3 md:items-end md:gap-4">
           <div className="flex w-full gap-2 md:w-auto md:gap-3">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-700 md:w-16 md:flex-none ${i <= step ? 'bg-cocoa-900 dark:bg-white md:scale-x-110' : 'bg-cocoa-100 dark:bg-cocoa-800'}`}
              />
            ))}
          </div>
          <p className="text-xs font-bold tracking-widest uppercase text-cocoa-500">Milestone {step} / 04</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="min-h-[420px] md:min-h-[560px]"
        >
          {step === 1 && <StepOneIngredients />}
          {step === 2 && <StepTwoSweetness />}
          {step === 3 && <StepThreeTexture />}
          {step === 4 && <StepFourAssembly />}
        </motion.div>
      </AnimatePresence>

      {/* Persistent Controls */}
      <div className="fixed bottom-[4.75rem] left-1/2 z-50 w-full max-w-3xl -translate-x-1/2 px-3 md:bottom-6 md:px-6">
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2 rounded-2xl border border-white/20 bg-white/90 p-2.5 shadow-2xl backdrop-blur-2xl dark:border-white/5 dark:bg-cocoa-950/90 md:rounded-[2rem] md:p-3">
          <button 
            onClick={prevStep} 
            disabled={step === 1}
            className={`flex min-h-11 items-center rounded-xl px-3 text-xs font-bold uppercase tracking-widest transition-all md:px-5 ${
              step === 1 ? 'pointer-events-none opacity-0' : 'text-cocoa-900 hover:bg-cocoa-50 dark:text-white dark:hover:bg-cocoa-800'
            }`}
          >
            <ArrowLeft className="mr-0 h-4 w-4 md:mr-3" /> <span className="hidden md:inline">Back</span>
          </button>
          
          <div className="grid min-w-0 grid-cols-3 items-center gap-1 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-cocoa-400 md:gap-3 md:text-[10px] md:tracking-[0.2em]">
             <div className="flex min-w-0 flex-col items-center justify-center gap-1 md:flex-row md:gap-2.5">
                <Beaker size={15} className="text-cocoa-300" />
                <span className="leading-none">{selectedIngredients.length} Ingr.</span>
             </div>
             <div className="flex min-w-0 flex-col items-center justify-center gap-1 md:flex-row md:gap-2.5">
                <Settings size={15} className="text-cocoa-300" />
                <span className="leading-none">{sweetness}%</span>
             </div>
             <div className="flex min-w-0 flex-col items-center justify-center gap-1 md:flex-row md:gap-2.5">
                <Package size={15} className="text-cocoa-300" />
                <span className="max-w-full truncate leading-none">{textureStyle.split('™')[0]}</span>
             </div>
          </div>

          {step < 4 ? (
            <button 
              onClick={nextStep}
              disabled={selectedIngredients.length === 0 && step === 1}
              className="flex min-h-11 items-center rounded-xl bg-cocoa-900 px-4 text-xs font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-cocoa-900/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-cocoa-900 md:px-8"
            >
              <span className="hidden sm:inline">Continue</span><span className="sm:hidden">Next</span> <ArrowRight className="ml-2 h-4 w-4 md:ml-3" />
            </button>
          ) : (
            <button
              onClick={addCustomKit}
              className="flex min-h-11 items-center rounded-xl bg-cocoa-900 px-4 text-xs font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-cocoa-900/20 active:scale-95 dark:bg-white dark:text-cocoa-900 md:px-6"
            >
              <span className="hidden sm:inline">Deploy</span><span className="sm:hidden">Add</span> <Sparkles className="ml-2 h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Builder;

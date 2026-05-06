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

  // --- Sub-Components for Steps ---

  const StepOneIngredients = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
      {INGREDIENTS.map((ing) => {
        const isSelected = selectedIngredients.includes(ing.id);
        return (
          <motion.div
            key={ing.id}
            layoutId={ing.id}
            onClick={() => toggleIngredient(ing.id)}
            whileHover={{ y: -5 }}
            className={`group relative cursor-pointer rounded-[2rem] p-8 border-2 transition-all duration-500 ${
              isSelected 
                ? 'bg-white dark:bg-cocoa-800 border-cocoa-900 dark:border-cocoa-100 shadow-2xl scale-[1.02]' 
                : 'bg-white/40 dark:bg-cocoa-900/40 border-transparent hover:border-cocoa-200 dark:hover:border-cocoa-700 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div 
                className="w-16 h-16 rounded-3xl shadow-inner rotate-3 group-hover:rotate-6 transition-transform duration-500" 
                style={{ backgroundColor: ing.color }} 
              />
              <AnimatePresence>
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -45 }}
                    className="bg-cocoa-900 dark:bg-white text-white dark:text-cocoa-900 p-2 rounded-full"
                  >
                    <Check size={18} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <h3 className="font-serif text-2xl font-medium mb-2 text-cocoa-900 dark:text-cocoa-50">{ing.name}</h3>
            <p className="text-sm text-cocoa-600 dark:text-cocoa-400 mb-6 leading-relaxed font-light">{ing.description}</p>
            <div className="flex flex-wrap gap-2 mt-auto">
              {ing.badges.map(badge => (
                <span key={badge} className="text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 bg-cocoa-50 dark:bg-cocoa-700/50 rounded-full text-cocoa-500 dark:text-cocoa-300 font-bold border border-cocoa-100 dark:border-cocoa-600">
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
      <div className="flex flex-col items-center justify-center py-20 bg-white/30 dark:bg-cocoa-900/30 rounded-[3rem] backdrop-blur-sm border border-white/20">
        <h3 className="font-serif text-4xl mb-4 text-center">Define Your Profile</h3>
        <p className="text-cocoa-500 dark:text-cocoa-400 mb-16 text-center max-w-md">The sweetness ratio defines the structural integrity and flavor release of your custom bar.</p>
        
        <div className="w-full max-w-2xl relative mb-16 px-10">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={sweetness}
            onChange={(e) => setSweetness(parseInt(e.target.value))}
            className="w-full h-3 bg-cocoa-100 dark:bg-cocoa-800 rounded-full appearance-none cursor-pointer accent-cocoa-900 dark:accent-white"
          />
          <div className="flex justify-between mt-6 text-[10px] tracking-[0.3em] uppercase text-cocoa-400 font-bold">
            <span>0% / Raw</span>
            <span>50% / Optimal</span>
            <span>100% / Dessert</span>
          </div>
        </div>

        <motion.div 
          key={sweetness}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-8xl font-serif text-cocoa-900 dark:text-cocoa-100 mb-4 tracking-tighter">
            {sweetness}<span className="text-4xl text-cocoa-300 dark:text-cocoa-600">%</span>
          </div>
          <div className="text-xl text-cocoa-600 dark:text-cocoa-300 font-serif italic">
            {getSweetnessLabel(sweetness)}
          </div>
        </motion.div>
        
        <div className="mt-16 p-8 glass rounded-3xl max-w-lg w-full text-center border border-white/10 shadow-inner">
            <p className="text-sm italic text-cocoa-500 dark:text-cocoa-400 leading-relaxed font-light">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-10">
        {styles.map((style) => (
          <motion.button
            key={style.name}
            onClick={() => setTextureStyle(style.name)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left ${
              textureStyle === style.name 
                ? 'border-cocoa-900 bg-white dark:bg-cocoa-800 dark:border-white shadow-2xl' 
                : 'border-transparent bg-white/40 dark:bg-cocoa-900/40 hover:bg-white hover:shadow-lg dark:hover:bg-cocoa-800'
            }`}
          >
            <div className={`w-24 h-32 bg-gradient-to-br from-cocoa-800 to-black shadow-2xl mr-8 flex-shrink-0 transition-all duration-500 ${style.shape} ${textureStyle === style.name ? 'scale-110 shadow-cocoa-900/40' : ''}`} />
            <div>
              <h4 className="font-serif text-2xl font-medium text-cocoa-900 dark:text-white mb-2">{style.name}</h4>
              <p className="text-cocoa-500 dark:text-cocoa-400 text-sm font-light leading-relaxed">{style.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    );
  };

  const StepFourAssembly = () => (
    <div className="max-w-5xl mx-auto py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block py-1 px-4 mb-6 rounded-full bg-cocoa-900 dark:bg-white text-white dark:text-cocoa-900 text-xs font-bold tracking-[0.2em] uppercase">Final Configuration</span>
          <h3 className="font-serif text-5xl md:text-6xl mb-8 leading-tight">Your Studio Kit is Ready.</h3>
          <p className="mb-10 text-cocoa-600 dark:text-cocoa-400 text-lg leading-relaxed font-light">
            You've engineered a custom blend with {selectedIngredients.length} ingredients at {sweetness}% sweetness, optimized for the {textureStyle} form factor.
          </p>
          
          <div className="space-y-6 mb-12">
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
                className="flex items-center space-x-4 group"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cocoa-100 dark:bg-cocoa-800 text-cocoa-900 dark:text-white text-[10px] font-bold group-hover:bg-cocoa-900 group-hover:text-white transition-colors">
                  0{i + 1}
                </span>
                <span className="text-cocoa-700 dark:text-cocoa-200 tracking-wide">{step}</span>
              </motion.div>
            ))}
          </div>

          <button 
            onClick={() => addToCart({ id: `custom-kit-${Date.now()}`, name: `Custom BLANK Kit (${textureStyle})`, price: 3500, image: 'https://images.unsplash.com/photo-1623259960243-7f722cb54a9d?auto=format&fit=crop&q=80&w=800', category: 'kit', note: `${sweetness}% sweetness, ${selectedIngredients.length} ingredients` })}
            className="w-full md:w-auto px-12 py-5 bg-cocoa-900 text-white dark:bg-white dark:text-cocoa-900 rounded-2xl font-bold uppercase tracking-widest hover:bg-black dark:hover:bg-cocoa-100 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
          >
            Deploy Custom Kit - ₹3,500 <Sparkles size={18} />
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1 }}
          className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl group"
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
    <div className="min-h-screen pt-32 pb-40 px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-red-100/30 blur-[120px] rounded-full dark:bg-red-900/5" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-cocoa-100/50 blur-[120px] rounded-full dark:bg-cocoa-900/10" />
      </div>

      {/* Progress Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
        <div>
          <span className="text-xs font-bold tracking-[0.4em] uppercase text-cocoa-400 mb-2 block">The Laboratory</span>
          <h2 className="text-6xl md:text-8xl font-serif text-cocoa-900 dark:text-cocoa-50 tracking-tighter">Studio<span className="text-cocoa-300">.</span></h2>
        </div>
        
        <div className="flex flex-col items-end gap-4">
           <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`h-1.5 w-16 rounded-full transition-all duration-700 ${i <= step ? 'bg-cocoa-900 dark:bg-white scale-x-110' : 'bg-cocoa-100 dark:bg-cocoa-800'}`} 
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
          className="min-h-[600px]"
        >
          {step === 1 && <StepOneIngredients />}
          {step === 2 && <StepTwoSweetness />}
          {step === 3 && <StepThreeTexture />}
          {step === 4 && <StepFourAssembly />}
        </motion.div>
      </AnimatePresence>

      {/* Persistent Controls */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40">
        <div className="bg-white/80 dark:bg-cocoa-950/80 backdrop-blur-2xl border border-white/20 dark:border-white/5 p-4 rounded-[2rem] shadow-2xl flex justify-between items-center">
          <button 
            onClick={prevStep} 
            disabled={step === 1}
            className={`flex items-center px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-cocoa-50 dark:hover:bg-cocoa-800 text-cocoa-900 dark:text-white'
            }`}
          >
            <ArrowLeft className="mr-3 w-4 h-4" /> Back
          </button>
          
          <div className="hidden md:flex items-center gap-8 text-[10px] font-bold tracking-[0.2em] uppercase text-cocoa-400">
             <div className="flex items-center gap-2.5 h-full">
                <Beaker size={15} className="text-cocoa-300" />
                <span className="leading-none mt-[1px]">{selectedIngredients.length} Ingr.</span>
             </div>
             <div className="flex items-center gap-2.5 h-full">
                <Settings size={15} className="text-cocoa-300" />
                <span className="leading-none mt-[1px]">{sweetness}%</span>
             </div>
             <div className="flex items-center gap-2.5 h-full">
                <Package size={15} className="text-cocoa-300" />
                <span className="leading-none mt-[1px]">{textureStyle.split(' ')[0]}</span>
             </div>
          </div>

          {step < 4 ? (
            <button 
              onClick={nextStep}
              disabled={selectedIngredients.length === 0 && step === 1}
              className="flex items-center px-10 py-4 bg-cocoa-900 text-white dark:bg-white dark:text-cocoa-900 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl hover:shadow-cocoa-900/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              Continue <ArrowRight className="ml-3 w-4 h-4" />
            </button>
          ) : (
             <div className="w-[120px]" /> 
          )}
        </div>
      </div>
    </div>
  );
};

export default Builder;
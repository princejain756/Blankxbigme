import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, ChefHat, Play, ArrowRight, ArrowLeft } from 'lucide-react';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {INGREDIENTS.map((ing) => {
        const isSelected = selectedIngredients.includes(ing.id);
        return (
          <motion.div
            key={ing.id}
            layoutId={ing.id}
            onClick={() => toggleIngredient(ing.id)}
            className={`group relative cursor-pointer rounded-2xl p-6 border transition-all duration-300 ${
              isSelected 
                ? 'bg-white dark:bg-cocoa-800 border-cocoa-900 dark:border-cocoa-400 shadow-xl scale-[1.02]' 
                : 'bg-white/40 dark:bg-cocoa-900/40 border-transparent hover:border-cocoa-200 dark:hover:border-cocoa-700'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-full shadow-inner" 
                style={{ backgroundColor: ing.color }} 
              />
              {isSelected && (
                <div className="bg-cocoa-900 text-white p-1 rounded-full">
                  <Check size={14} />
                </div>
              )}
            </div>
            <h3 className="font-serif text-xl font-medium mb-1">{ing.name}</h3>
            <p className="text-sm text-cocoa-600 dark:text-cocoa-300 mb-3 leading-relaxed">{ing.description}</p>
            <div className="flex flex-wrap gap-2 mt-auto">
              {ing.badges.map(badge => (
                <span key={badge} className="text-[10px] uppercase tracking-wider px-2 py-1 bg-cocoa-100 dark:bg-cocoa-700 rounded-md text-cocoa-800 dark:text-cocoa-200">
                  {badge}
                </span>
              ))}
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Info size={16} className="text-cocoa-400" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const StepTwoSweetness = () => {
    const getSweetnessLabel = (val: number) => {
      if (val < 25) return "Bitter & Intense";
      if (val < 50) return "Balanced Dark";
      if (val < 75) return "Sweet Indulgence";
      return "Festival Mode 🍫";
    };

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="font-serif text-3xl mb-12 text-center">Adjust Sweetness Level</h3>
        
        <div className="w-full max-w-2xl relative mb-12">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={sweetness}
            onChange={(e) => setSweetness(parseInt(e.target.value))}
            className="w-full h-2 bg-cocoa-200 rounded-lg appearance-none cursor-pointer dark:bg-cocoa-700 accent-cocoa-900 dark:accent-cocoa-100"
          />
          <div className="flex justify-between mt-4 text-xs tracking-widest uppercase text-cocoa-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <motion.div 
          key={sweetness}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-5xl font-serif text-cocoa-900 dark:text-cocoa-100 mb-2">
            {sweetness}%
          </div>
          <div className="text-lg text-cocoa-600 dark:text-cocoa-400">
            {getSweetnessLabel(sweetness)}
          </div>
        </motion.div>
        
        <div className="mt-12 p-8 glass rounded-2xl max-w-md w-full text-center">
            <p className="text-sm italic text-cocoa-600 dark:text-cocoa-300">
                "At {sweetness}%, the cocoa notes {sweetness > 50 ? 'are softened by sugar crystals' : 'remain bold and uncompromised'}."
            </p>
        </div>
      </div>
    );
  };

  const StepThreeTexture = () => {
    const styles = [
      { name: 'Blankets™', desc: 'Comfy & Guilt-Free', shape: 'rounded-xl' },
      { name: 'Blank Bites™', desc: 'Crisp & Snappy', shape: 'rounded-sm' },
      { name: 'Blank Crunch™', desc: 'Layered & Bold', shape: 'rounded-none border-2' },
      { name: 'Blank Melt™', desc: 'Silky & Smooth', shape: 'rounded-3xl' },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
        {styles.map((style) => (
          <motion.button
            key={style.name}
            onClick={() => setTextureStyle(style.name)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center p-6 rounded-2xl border-2 transition-all text-left ${
              textureStyle === style.name 
                ? 'border-cocoa-900 bg-white dark:bg-cocoa-800 dark:border-cocoa-100 shadow-lg' 
                : 'border-transparent bg-white/50 dark:bg-cocoa-900/50 hover:bg-white'
            }`}
          >
            <div className={`w-16 h-24 bg-gradient-to-br from-cocoa-600 to-cocoa-800 shadow-lg mr-6 ${style.shape} flex-shrink-0`} />
            <div>
              <h4 className="font-serif text-xl font-medium">{style.name}</h4>
              <p className="text-cocoa-600 dark:text-cocoa-400 text-sm mt-1">{style.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    );
  };

  const StepFourAssembly = () => (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h3 className="font-serif text-3xl mb-6">Ready to Assemble.</h3>
          <p className="mb-8 text-cocoa-600 dark:text-cocoa-300 leading-relaxed">
            Your kit includes all pre-measured ingredients, your custom mold ({textureStyle}), and a step-by-step guide to tempering chocolate like a master chocolatier.
          </p>
          <ul className="space-y-4 mb-8">
            {[
              "Melt base ingredients at 45°C",
              "Fold in sugars and additives",
              "Temper on marble (or cool bowl)",
              "Pour into Blankets™ mold"
            ].map((step, i) => (
              <li key={i} className="flex items-center space-x-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cocoa-200 dark:bg-cocoa-700 text-xs font-bold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
          <button 
            onClick={() => addToCart({ id: 'custom-kit', name: 'Custom BLANK Kit', price: 55, image: '', category: 'kit' })}
            className="w-full md:w-auto px-8 py-4 bg-cocoa-900 text-white rounded-full font-medium hover:bg-cocoa-800 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            Add Kit to Cart - $55.00
          </button>
        </div>
        <div className="relative aspect-square bg-cocoa-100 dark:bg-cocoa-800 rounded-3xl overflow-hidden shadow-inner">
          {/* Abstract visual of the final kit */}
          <div className="absolute inset-0 flex items-center justify-center">
             <ChefHat size={64} className="text-cocoa-300 dark:text-cocoa-600 mb-4" />
          </div>
          <img 
            src="https://images.unsplash.com/photo-1623259960243-7f722cb54a9d?auto=format&fit=crop&q=80&w=800" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay hover:scale-105 transition-transform duration-700" 
            alt="Assembly"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-serif text-cocoa-900 dark:text-cocoa-50">Studio</h2>
          <p className="text-cocoa-500 dark:text-cocoa-400 mt-1">Step {step} of 4</p>
        </div>
        
        {/* Progress Bar */}
        <div className="hidden md:flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={`h-1 w-12 rounded-full transition-colors ${i <= step ? 'bg-cocoa-900 dark:bg-cocoa-100' : 'bg-cocoa-200 dark:bg-cocoa-800'}`} 
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[500px]"
        >
          {step === 1 && <StepOneIngredients />}
          {step === 2 && <StepTwoSweetness />}
          {step === 3 && <StepThreeTexture />}
          {step === 4 && <StepFourAssembly />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-cocoa-950/80 backdrop-blur-md border-t border-cocoa-100 dark:border-cocoa-800 p-6 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={prevStep} 
            disabled={step === 1}
            className={`flex items-center px-6 py-3 rounded-full font-medium transition-colors ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-cocoa-100 dark:hover:bg-cocoa-800 text-cocoa-900 dark:text-cocoa-100'
            }`}
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </button>
          
          {step < 4 ? (
            <button 
              onClick={nextStep}
              disabled={selectedIngredients.length === 0 && step === 1}
              className="flex items-center px-8 py-3 bg-cocoa-900 text-white dark:bg-white dark:text-cocoa-900 rounded-full font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          ) : (
             <div /> /* Placeholder to keep flex layout */
          )}
        </div>
      </div>
    </div>
  );
};

export default Builder;
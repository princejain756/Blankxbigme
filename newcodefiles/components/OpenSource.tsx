import React from 'react';
import { motion } from 'framer-motion';
import { GitFork, Star, Upload, Github } from 'lucide-react';
import { COMMUNITY_RECIPES } from '../constants';

const OpenSource: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20 items-center">
        <div>
          <span className="inline-block py-1 px-3 mb-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 text-xs tracking-wider uppercase font-bold">
            Public Beta
          </span>
          <h2 className="text-5xl font-serif mb-6 leading-tight text-cocoa-900 dark:text-cocoa-50">
            Chocolate should be <br/> <span className="italic text-cocoa-500">transparent.</span>
          </h2>
          <p className="text-lg text-cocoa-600 dark:text-cocoa-300 mb-8 leading-relaxed">
            Just like open-source software, we believe in open-source flavor. 
            View the exact sourcing tree of every ingredient. Fork community recipes. 
            Commit your own improvements.
          </p>
          <div className="flex gap-4">
             <button className="flex items-center px-6 py-3 bg-cocoa-900 text-white rounded-lg font-medium hover:bg-cocoa-800 transition-colors">
               <Upload className="mr-2 w-4 h-4" /> Submit Recipe
             </button>
             <button className="flex items-center px-6 py-3 border border-cocoa-200 dark:border-cocoa-700 rounded-lg font-medium hover:bg-cocoa-50 dark:hover:bg-cocoa-900 transition-colors">
               <Github className="mr-2 w-4 h-4" /> View on GitHub
             </button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-3xl transform rotate-3" />
          <div className="glass p-8 rounded-3xl border border-cocoa-100 dark:border-cocoa-800 relative shadow-2xl">
             <pre className="font-mono text-xs md:text-sm text-cocoa-800 dark:text-cocoa-200 overflow-x-auto">
{`{
  "recipe": "Midnight Sea Salt",
  "version": "1.2.0",
  "base": {
    "ingredient": "BLANK Dark Cocoa",
    "percentage": 85
  },
  "modifiers": [
    { "id": "sea-salt", "grams": 2 },
    { "id": "vanilla", "type": "madagascar" }
  ],
  "license": "MIT"
}`}
             </pre>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-serif mb-8 border-b border-cocoa-100 dark:border-cocoa-800 pb-4">Top Community Forks</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COMMUNITY_RECIPES.map((recipe, idx) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-cocoa-900 border border-cocoa-100 dark:border-cocoa-800 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cocoa-400 to-cocoa-600" />
                 <span className="text-sm font-medium text-cocoa-900 dark:text-cocoa-100">@{recipe.author}</span>
               </div>
               <div className="flex items-center space-x-3 text-sm text-cocoa-500">
                 <span className="flex items-center"><Star size={14} className="mr-1" /> {recipe.stars}</span>
                 <span className="flex items-center"><GitFork size={14} className="mr-1" /> {recipe.forks}</span>
               </div>
             </div>
             
             <h4 className="text-xl font-serif font-medium mb-2">{recipe.name}</h4>
             <p className="text-sm text-cocoa-600 dark:text-cocoa-400 mb-4">{recipe.description}</p>
             
             <div className="flex flex-wrap gap-2 mb-4">
               {recipe.ingredients.map(ing => (
                 <span key={ing} className="text-xs bg-cocoa-50 dark:bg-cocoa-800 px-2 py-1 rounded text-cocoa-700 dark:text-cocoa-300">
                   {ing}
                 </span>
               ))}
             </div>
             
             <button className="w-full py-2 text-xs font-bold uppercase tracking-wider border border-cocoa-200 dark:border-cocoa-700 rounded hover:bg-cocoa-50 dark:hover:bg-cocoa-800 transition-colors">
               Fork this Recipe
             </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OpenSource;
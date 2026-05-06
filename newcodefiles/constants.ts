import { Ingredient, Product, Recipe } from './types';

export const SITE_DETAILS = {
  email: 'contact@prince.sh',
  phone: '+91 80056 34678',
  whatsapp: '+91 80056 34678',
  whatsappHref: 'https://wa.me/918005634678',
  countryOfOrigin: 'India',
  fssaiLicense: '21225190000696',
};

export const FREE_SHIPPING_THRESHOLD = 500;

export const CHOCOLATE_LABEL = {
  name: 'BLANK Chocolate',
  mrp: 100,
  unitLabel: '5 pieces',
  ingredients: [
    'Brown sugar',
    'Cocoa solids',
    'Skimmed Milk Powder',
    'Stevia',
    'Erythritol',
    'Monk Fruit',
  ],
};

export const CHOCOLATE_GALLERY_IMAGES = [
  { src: '/product-images/45degree.png', alt: 'Blank@TS chocolate arranged on a wooden plate', label: 'Hero View' },
  { src: '/product-images/eyeleve.png', alt: 'Blank@TS chocolate stacked on a tray', label: 'Display Stack' },
  { src: '/product-images/topview.png', alt: 'Top view of five Blank@TS chocolate pieces', label: 'Top View' },
  { src: '/product-images/Brokenbite.png', alt: 'Broken Blank@TS chocolate showing the interior texture', label: 'Broken Bite' },
  { src: '/product-images/MacroCloseup.png', alt: 'Macro close-up of wrapped Blank@TS chocolate pieces', label: 'Macro Close-Up' },
];

export const INGREDIENTS: Ingredient[] = [
  {
    id: 'cocoa-powder',
    name: 'BLANK Cocoa Powder',
    type: 'base',
    description: 'Single-origin cocoa with deep nutty undertones.',
    origin: 'Ecuador',
    badges: ['Organic', 'Fair Trade'],
    price: 12,
    color: '#5D4037',
    image: 'https://images.unsplash.com/photo-1540645605051-7f9a1cb18086?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'dark-cocoa',
    name: 'BLANK Dark Cocoa',
    type: 'base',
    description: 'Intense, 85% dark roast for the purist.',
    origin: 'Ghana',
    badges: ['Vegan', 'Keto'],
    price: 14,
    color: '#3E2723',
    image: 'https://images.unsplash.com/photo-1614088685112-0a760b7163c8?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'brown-sugar',
    name: 'BLANK Organic Brown Sugar',
    type: 'sugar',
    description: 'Rich molasses notes with a soft caramel finish.',
    origin: 'Philippines',
    badges: ['Organic'],
    price: 8,
    color: '#8D6E63',
    image: 'https://images.unsplash.com/photo-1622484211148-526279328246?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'coco-milk',
    name: 'Vegan Coconut Milk Powder',
    type: 'additive',
    description: 'Creamy, dairy-free alternative for a lush texture.',
    origin: 'Sri Lanka',
    badges: ['Vegan', 'Gluten-Free'],
    price: 10,
    color: '#EFEBE9',
    image: 'https://images.unsplash.com/photo-1594488518625-2b47ee2388c3?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'milk-powder',
    name: 'Premium Milk Powder',
    type: 'additive',
    description: 'Farm-fresh milk dehydrated at low temps.',
    origin: 'Switzerland',
    badges: ['Grass-Fed'],
    price: 9,
    color: '#FFF8E1',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    id: 'corn-flour',
    name: 'Fine Corn Flour',
    type: 'additive',
    description: 'Adds a unique crisp snap to the final bar.',
    origin: 'USA',
    badges: ['Non-GMO'],
    price: 5,
    color: '#FFF9C4',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=300&h=300'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'blank-ts-signature',
    name: 'Blank@TS Signature Chocolate',
    price: 100,
    category: 'chocolate',
    image: '/product-images/45degree.png',
    description: 'Signature chocolate pack crafted for a rich, smooth bite.',
    meta: '5 pieces',
    note: 'Brown sugar, cocoa solids, skimmed milk powder, stevia, erythritol, monk fruit',
  },
  {
    id: 'blank-brown-sugar',
    name: 'BLANK Brown Sugar',
    price: 200,
    category: 'ingredient',
    image: '/product-images/topview.png',
    description: 'Rich brown sugar for chocolate blends, baking, and dessert work.',
    note: 'Warm caramel depth and balanced sweetness',
  },
  {
    id: 'blank-zero',
    name: 'BLANK ZERO',
    price: 400,
    category: 'ingredient',
    image: '/product-images/blankbar.png',
    description: 'Monk fruit sweetener special - the composition where you feel the sweetness.',
    meta: '50 g = 250 g of sugar',
    note: 'Lab report: protein, carbohydrate, energy, total fat, total sugar, sodium, and selenium were below detection limit',
  },
  {
    id: 'daytime-glasses',
    name: 'Daytime Blue-Light Filter Glasses',
    price: 2500,
    category: 'nature-aligned',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=600',
    description: 'Reduces digital eye strain and protects circadian rhythms during work hours.',
    note: 'Optimized for 450nm-500nm protection',
  },
  {
    id: 'sleep-blocker-glasses',
    name: 'Evening Sleep Blocker Glasses',
    price: 3000,
    category: 'nature-aligned',
    image: 'https://images.unsplash.com/photo-1511499767350-a1590fdb7301?auto=format&fit=crop&q=80&w=600',
    description: 'Optimized to block sleep-disrupting blue light for deep, restorative rest.',
    note: 'Deep amber tint for maximum melatonin protection',
  },
  {
    id: 'red-light-glasses',
    name: 'Red Light Therapy Glasses',
    price: 4500,
    category: 'nature-aligned',
    image: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&q=80&w=600',
    description: 'Bio-hacking tool for recovery and cellular wellness.',
    note: '660nm & 850nm dual wavelength',
  },
  {
    id: 'lllt-hair-cap',
    name: 'LLLT Hair Therapy Cap',
    price: 15000,
    category: 'nature-aligned',
    image: 'https://images.unsplash.com/photo-1620331711675-4a5ec2aaee7e?auto=format&fit=crop&q=80&w=600',
    description: 'Low-Level Laser Therapy for hair health and scalp wellness.',
    note: 'Clinically proven laser technology',
  },
  {
    id: 'bigme-hibreak-pro-color-6-e-ink-eye-friendly-smartphone-with-4g-5g-connection',
    name: 'Bigme Hibreak Pro Color 5G',
    price: 33516,
    category: 'nature-aligned',
    image: '/BIGME/bigme-hibreak-pro-color-6-e-ink-eye-friendly-smartphone-with-4g-5g-connection.png',
    description: 'Unleash Colorful Performance with Hibreak Pro Color. Revolutionary Kaleido 3 color ePaper display.',
    note: 'Eye-Friendly 5G Smartphone',
  },
  {
    id: 'hibreak-plus-6-13epaper-4g-handwriting-smartphone',
    name: 'Hibreak Plus 6.13" ePaper 4G',
    price: 20916,
    category: 'nature-aligned',
    image: '/BIGME/hibreak-plus-6-13epaper-4g-handwriting-smartphone.jpg',
    description: '4G handwriting smartphone with 52FPS, Android 14OS and 4+64GB Storage.',
    note: 'Handwriting Smartphone',
  },
  {
    id: 'bigme-b10-10-34g-premium-color-e-paper-digital-tablet-with-android-14os',
    name: 'Bigme B10 10.3" 4G Premium Color',
    price: 49908,
    category: 'nature-aligned',
    image: '/BIGME/bigme-b10-10-34g-premium-color-e-paper-digital-tablet-with-android-14os.jpg',
    description: '10.3" 4G Premium Color E-paper digital tablet with Android 14OS.',
    note: 'Premium Color E-ink Tablet',
  },
  {
    id: 'bigme-b7-pro-powerful-color-epaper-phone-tablet-8-256gb-with-android-14os-and-4g-calling',
    name: 'Bigme B7 PRO Phone-Tablet',
    price: 29316,
    category: 'nature-aligned',
    image: '/BIGME/bigme-b7-pro-powerful-color-epaper-phone-tablet-8-256gb-with-android-14os-and-4g-calling.jpg',
    description: 'Powerful color epaper Phone-Tablet 8+256GB with Android 14OS and 4G calling.',
    note: '8+256GB High Performance',
  },
  {
    id: 'bigme-b751c-s-upgraded-7inch-color-ereder-with-android-14-os',
    name: 'Bigme B751C S Upgraded',
    price: 20916,
    category: 'nature-aligned',
    image: '/BIGME/bigme-b751c-s-upgraded-7inch-color-ereder-with-android-14-os.jpg',
    description: 'Upgraded 7inch color ereader with Android 14 OS.',
    note: '300PPI B/W, 150PPI Color',
  },
  {
    id: 'b13-worlds-first-13-3-color-epaper-monitor',
    name: 'B13 13.3" Color ePaper Monitor',
    price: 57036,
    category: 'nature-aligned',
    image: '/BIGME/b13-worlds-first-13-3-color-epaper-monitor.jpg',
    description: 'The world\'s first 13.3" color ePaper monitor. Gentle on the eyes for professional work.',
    note: 'Color E-ink Monitor',
  }
];

export const COMMUNITY_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    name: 'Midnight Sea Salt',
    author: 'alex_codes',
    stars: 4.9,
    forks: 124,
    description: '85% Dark Cocoa with a hint of Maldon salt.',
    ingredients: ['BLANK Dark Cocoa', 'Sea Salt'],
    image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'rec-2',
    name: 'Spicy Aztec',
    author: 'choc_lab',
    stars: 4.7,
    forks: 89,
    description: 'Cinnamon and chili infused blend.',
    ingredients: ['BLANK Cocoa Powder', 'Chili', 'Cinnamon'],
    image: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'rec-3',
    name: 'Matcha White',
    author: 'zen_baker',
    stars: 5.0,
    forks: 210,
    description: 'White chocolate base with ceremonial matcha.',
    ingredients: ['Milk Powder', 'Matcha'],
    image: 'https://images.unsplash.com/photo-1582236528751-a1e4c76b4a39?auto=format&fit=crop&q=80&w=500'
  }
];

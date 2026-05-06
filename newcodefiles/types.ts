export interface Ingredient {
  id: string;
  name: string;
  type: 'base' | 'sugar' | 'additive';
  description: string;
  origin: string;
  badges: string[];
  price: number;
  color: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'ingredient' | 'kit' | 'tool' | 'chocolate' | 'nature-aligned';
  description?: string;
  meta?: string;
  note?: string;
}

export interface Recipe {
  id: string;
  name: string;
  author: string;
  stars: number;
  forks: number;
  description: string;
  ingredients: string[];
  image: string;
}

export type ViewState = 'hero' | 'builder' | 'shop' | 'opensource' | 'bigme' | 'policy';

export interface CartItem {
  id: string;
  quantity: number;
  product: Product | Ingredient;
}

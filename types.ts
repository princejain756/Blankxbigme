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
  category:
    | 'ingredient'
    | 'kit'
    | 'tool'
    | 'chocolate'
    | 'snack'
    | 'merch'
    | 'biohacking'
    | 'gadget'
    | 'nature-aligned';
  description?: string;
  meta?: string;
  note?: string;
  isBigme?: boolean;
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

export type ViewState =
  | 'hero'
  | 'builder'
  | 'shop'
  | 'opensource'
  | 'bigme'
  | 'policy'
  | 'checkout'
  | 'track'
  | 'admin';

export interface CartItem {
  id: string;
  quantity: number;
  product: Product | Ingredient;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface PublicOrder {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  items: OrderLineItem[];
  totals: {
    subtotal: number;
    shipping: number;
    total: number;
    currency: 'INR';
  };
  payment: {
    method: string;
    paymentId?: string;
  };
}

export interface AdminOrder extends PublicOrder {
  customer: PublicOrder['customer'] & {
    address?: string;
  };
}

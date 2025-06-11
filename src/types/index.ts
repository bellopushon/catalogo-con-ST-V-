export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  theme: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  company?: string;
  location?: string;
  plan: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'expired';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionCanceledAt?: string;
  paymentMethod?: string;
  paymentProvider?: 'stripe' | 'paypal' | null;
  stripeCustomerId?: string;
  paypalSubscriberId?: string;
  createdAt?: string;
  updatedAt?: string;
} 
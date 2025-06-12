export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: Record<string, any>;
  stripe_product_id: string;
  stripe_price_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  ended_at?: string;
  payment_method: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
} 
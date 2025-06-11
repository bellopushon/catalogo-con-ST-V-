export const STRIPE_PRICES = {
  gratuito: null,
  emprendedor: 'price_xxxxx', // Reemplazar con el ID real de Stripe
  profesional: 'price_yyyyy', // Reemplazar con el ID real de Stripe
  empresarial: 'price_zzzzz'  // Reemplazar con el ID real de Stripe
} as const;

export type PaymentProvider = 'stripe' | 'paypal' | null;
export type PlanName = keyof typeof STRIPE_PRICES;
export type SubscriptionStatus = 'active' | 'canceled' | 'expired';

export interface Invoice {
  id: string;
  number: string;
  created: number;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  amount_paid: number;
  currency: string;
  hosted_invoice_url: string;
  invoice_pdf: string;
} 
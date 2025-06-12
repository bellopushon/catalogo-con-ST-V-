import { loadStripe } from '@stripe/stripe-js';
import type { Plan, CheckoutSession } from '../types/stripe';
import { supabase } from './supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const createCheckoutSession = async (planId: string): Promise<CheckoutSession> => {
  const response = await fetch('/api/checkout/create-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ planId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear la sesión de checkout');
  }

  return response.json();
};

export const redirectToCheckout = async (planId: string) => {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe no está inicializado');

    const { url } = await createCheckoutSession(planId);
    window.location.href = url;
  } catch (error) {
    console.error('Error al redirigir al checkout:', error);
    throw error;
  }
};

export const getPlans = async (): Promise<Plan[]> => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;
  return data;
};

export const getCurrentSubscription = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (error) throw error;
  return data;
}; 
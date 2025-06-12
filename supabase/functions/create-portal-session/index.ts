import Stripe from 'https://esm.sh/stripe@13.10.0';
import { createClient } from '@supabase/supabase-js';

// Inicializar Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Inicializar Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Función para manejar errores
const handleError = (error: any, context: string) => {
  console.error(`Error en ${context}:`, error);
  return new Response(
    JSON.stringify({ 
      error: `Error en ${context}`,
      message: error.message 
    }),
    { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

// Función para validar el usuario
const validateUser = async (userId: string) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('Usuario no encontrado');
  }

  if (!user.stripe_customer_id) {
    throw new Error('Usuario no tiene una suscripción activa');
  }

  return user;
};

Deno.serve(async (req: Request) => {
  try {
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Falta el ID del usuario');
    }

    // Validar usuario
    const user = await validateUser(userId);

    // Crear sesión del portal
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/account`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error, 'creación de sesión del portal');
  }
}); 
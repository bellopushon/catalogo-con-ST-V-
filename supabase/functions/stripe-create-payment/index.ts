// Follow this setup guide to integrate the Deno runtime and Supabase functions in your project:
// https://supabase.com/docs/guides/functions/getting-started

import { serve } from "npm:@supabase/functions-js@2.1.5";
import { createClient } from "npm:@supabase/supabase-js@2.43.4";
import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Función para validar el plan
const validatePlan = async (planId: string) => {
  const { data: plan, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error || !plan) {
    throw new Error('Plan no válido');
  }

  return plan;
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

  return user;
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      throw new Error("Required environment variables are missing");
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { planId, userId, successUrl, cancelUrl } = await req.json();

    if (!planId || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar plan y usuario
    const [plan, userData] = await Promise.all([
      validatePlan(planId),
      validateUser(userId)
    ]);

    // Get or create Stripe customer
    let customerId = userData.stripe_customer_id;
    if (!customerId) {
      // Create new customer in Stripe
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.name,
        metadata: {
          userId: userData.id
        }
      });

      customerId = customer.id;

      // Save customer ID to user record
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${successUrl}?plan=${planId}`,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error, 'creación de pago');
  }
});
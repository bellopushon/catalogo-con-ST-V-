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
  // Aquí podrías añadir notificaciones (email, Slack, etc.)
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

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  try {
    // Verificar firma del webhook
    if (!signature) {
      throw new Error('No se encontró la firma de Stripe');
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleError(error, 'webhook de Stripe');
  }
});

// Función para manejar creación de suscripción
async function handleSubscriptionCreated(subscription: any) {
  try {
    const customerId = subscription.customer;
    const planId = subscription.items.data[0].price.product;

    await supabase
      .from('users')
      .update({ 
        plan: planId,
        subscription_status: 'active',
        subscription_id: subscription.id
      })
      .eq('stripe_customer_id', customerId);
  } catch (error) {
    handleError(error, 'creación de suscripción');
  }
}

// Función para manejar actualización de suscripción
async function handleSubscriptionUpdated(subscription: any) {
  try {
    const customerId = subscription.customer;
    const planId = subscription.items.data[0].price.product;
    const status = subscription.status;

    await supabase
      .from('users')
      .update({ 
        plan: planId,
        subscription_status: status,
        subscription_id: subscription.id
      })
      .eq('stripe_customer_id', customerId);
  } catch (error) {
    handleError(error, 'actualización de suscripción');
  }
}

// Función para manejar eliminación de suscripción
async function handleSubscriptionDeleted(subscription: any) {
  try {
    const customerId = subscription.customer;

    await supabase
      .from('users')
      .update({ 
        plan: 'gratuito',
        subscription_status: 'canceled',
        subscription_id: null
      })
      .eq('stripe_customer_id', customerId);
  } catch (error) {
    handleError(error, 'eliminación de suscripción');
  }
}

// Función para manejar pago exitoso
async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    const customerId = invoice.customer;
    
    await supabase
      .from('users')
      .update({ 
        last_payment_status: 'succeeded',
        last_payment_date: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId);
  } catch (error) {
    handleError(error, 'pago exitoso');
  }
}

// Función para manejar pago fallido
async function handleInvoicePaymentFailed(invoice: any) {
  try {
    const customerId = invoice.customer;
    
    await supabase
      .from('users')
      .update({ 
        last_payment_status: 'failed',
        last_payment_date: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId);
  } catch (error) {
    handleError(error, 'pago fallido');
  }
} 
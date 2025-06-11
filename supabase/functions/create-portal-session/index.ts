import Stripe from 'https://esm.sh/stripe@13.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req: Request) => {
  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar token de autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener y validar datos del cuerpo
    const { customerId, returnUrl } = await req.json();
    
    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'Se requiere el ID del cliente' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear sesión del portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'http://localhost:3000/subscription',
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  } catch (error: any) {
    console.error('Error en create-portal-session:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Error al crear la sesión del portal',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}); 
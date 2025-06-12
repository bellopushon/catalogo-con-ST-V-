import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Crown, 
  Check, 
  Shield, 
  Store, 
  Package, 
  Palette, 
  BarChart3, 
  Headphones, 
  Instagram,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  maxStores: number;
  maxProducts: number;
  maxCategories: number;
  features: string[];
  isActive: boolean;
  isFree: boolean;
  level: number;
  stripe_price_id?: string;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setIsLoading(true);
        
        // Cargar planes desde Supabase
        const { data: plansData, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('level', { ascending: true });
          
        if (error) {
          console.error('Error loading plans:', error);
          return;
        }
        
        if (plansData) {
          const formattedPlans = plansData.map(plan => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: parseFloat(plan.price),
            maxStores: plan.max_stores,
            maxProducts: plan.max_products,
            maxCategories: plan.max_categories,
            features: plan.features || [],
            isActive: plan.is_active,
            isFree: plan.is_free,
            level: plan.level,
            stripe_price_id: plan.stripe_price_id,
          }));
          
          setPlans(formattedPlans);
          
          // Seleccionar el plan popular por defecto (nivel 2)
          const popularPlan = formattedPlans.find(p => p.level === 2);
          if (popularPlan) {
            setSelectedPlan(popularPlan.id);
          }
        }
        
        // Verificar si el usuario está autenticado
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
        
      } catch (error) {
        console.error('Error in loadPlans:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPlans();
  }, []);

  const premiumFeatures = [
    {
      icon: Store,
      title: 'Múltiples Tiendas',
      description: 'Crea hasta 5 tiendas diferentes para distintos negocios o líneas de productos'
    },
    {
      icon: Package,
      title: 'Más Productos',
      description: 'Hasta 50 productos por tienda con categorías ilimitadas'
    },
    {
      icon: Palette,
      title: 'Personalización Avanzada',
      description: 'Colores de tema personalizados y sin marca de agua'
    },
    {
      icon: BarChart3,
      title: 'Analíticas Completas',
      description: 'Estadísticas avanzadas con filtros y métricas detalladas'
    },
    {
      icon: Instagram,
      title: 'Integración Social',
      description: 'Instagram integrado en tu catálogo para mayor engagement'
    },
    {
      icon: Headphones,
      title: 'Soporte Prioritario',
      description: 'Soporte técnico prioritario con respuesta rápida'
    },
  ];

  // Nueva función para suscribirse
  const handleSubscribe = async (plan: Plan) => {
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }

    // Validar que el plan tenga stripe_price_id
    if (!plan.stripe_price_id) {
      alert('Este plan no está vinculado correctamente con Stripe. Contacta al administrador.');
      return;
    }

    // Obtener la sesión y el usuario autenticado
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const accessToken = session?.access_token;
    if (!user || !accessToken) {
      alert('Debes iniciar sesión.');
      return;
    }

    // Llamar a la función de Supabase para crear la sesión de pago
    const response = await fetch('https://<TU_SUPABASE_PROJECT>.functions.supabase.co/stripe-create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        planId: plan.id,
        userId: user.id,
        successUrl: window.location.origin + '/subscription/success',
        cancelUrl: window.location.origin + '/subscription/cancel',
      }),
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Error al crear la sesión de pago.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Tutaviendo</h1>
            </div>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Link 
                  to="/admin" 
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Ir al Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link 
                    to="/login?register=true" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Planes y Precios para Cada Negocio
              </h2>
              <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto mb-8">
                Desde tiendas básicas hasta negocios profesionales, tenemos el plan perfecto para cada etapa de tu crecimiento
              </p>
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
                <Crown className="w-4 h-4" />
                Prueba gratis y actualiza cuando estés listo
              </div>
            </div>
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {plans.map((plan) => {
              const isPlanPopular = plan.level === 2;
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all ${
                    isPlanPopular
                      ? 'border-indigo-500 scale-105 lg:scale-110 z-10'
                      : 'border-gray-200'
                  } ${
                    selectedPlan === plan.id ? 'ring-4 ring-indigo-200' : ''
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {isPlanPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                        Más Popular
                      </span>
                    </div>
                  )}

                  <div className="p-6 lg:p-8">
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>
                      
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-4xl font-bold text-gray-900">
                          ${plan.price.toFixed(2)}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-gray-600">/mes</span>
                        )}
                      </div>
                    </div>

                    {/* Limits */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm">Límites:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-700">
                            Tiendas: {plan.maxStores === 999999 ? '∞' : plan.maxStores}
                          </span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-700">
                            Productos/tienda: {plan.maxProducts === 999999 ? '∞' : plan.maxProducts}
                          </span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-700">
                            Categorías/tienda: {plan.maxCategories === 999999 ? '∞' : plan.maxCategories}
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      <h4 className="font-semibold text-gray-900 text-sm">Características:</h4>
                      <ul className="space-y-2">
                        {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-3 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    {!plan.isFree ? (
                      <button
                        className={`w-full py-3 px-6 rounded-lg font-medium transition-all text-center block ${
                          isPlanPopular
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transform hover:scale-105'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                        onClick={() => handleSubscribe(plan)}
                      >
                        {isLoggedIn ? `Suscribirse a ${plan.name}` : 'Registrarse'}
                      </button>
                    ) : (
                      <Link
                        to={isLoggedIn ? "/admin" : "/login?register=true"}
                        className="w-full py-3 px-6 rounded-lg font-medium transition-all text-center block bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        {isLoggedIn ? 'Ir al Dashboard' : 'Comenzar Gratis'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Características Premium
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Descubre todas las ventajas que obtienes con nuestros planes premium
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Preguntas Frecuentes
          </h2>
          
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                ¿Puedo cambiar de plan en cualquier momento?
              </h3>
              <p className="text-gray-600">
                Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican inmediatamente y se ajustará tu facturación de forma proporcional.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                ¿Qué métodos de pago aceptan?
              </h3>
              <p className="text-gray-600">
                Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express) y PayPal para todos nuestros planes de pago.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                ¿Hay garantía de devolución?
              </h3>
              <p className="text-gray-600">
                Ofrecemos una garantía de devolución de 30 días sin preguntas. Si no estás satisfecho con nuestro servicio, te devolvemos tu dinero.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                ¿Qué pasa si excedo los límites de mi plan?
              </h3>
              <p className="text-gray-600">
                Te notificaremos cuando te acerques a los límites de tu plan. Puedes actualizar a un plan superior en cualquier momento para aumentar tus límites.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Comienza a Vender por WhatsApp Hoy Mismo
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Crea tu tienda gratis en minutos y empieza a recibir pedidos directamente en tu WhatsApp
            </p>
            <Link
              to={isLoggedIn ? "/admin" : "/login?register=true"}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-lg font-bold text-lg inline-flex items-center gap-2 transition-colors"
            >
              {isLoggedIn ? 'Ir a Mi Dashboard' : 'Crear Mi Tienda Gratis'}
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Tutaviendo</h3>
              </div>
              <p className="text-gray-400 text-sm">
                La plataforma más sencilla para crear catálogos de WhatsApp y aumentar tus ventas.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutoriales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Novedades</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Estado del Servicio</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Términos de Servicio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Tutaviendo. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ShoppingBag icon component
function ShoppingBag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 7V6a6 6 0 1 1 12 0v1" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 7h18l-1.68 12.06A2 2 0 0 1 17.33 21H6.67a2 2 0 0 1-1.99-1.94L3 7Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Check, CreditCard, Star, Shield, Zap, X, Store, Package, Palette, BarChart3, Instagram, Eye } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import PaymentMethodForm from './PaymentMethodForm';
import ActiveSubscription from './ActiveSubscription';

const plans = [
  {
    id: 'gratuito',
    name: 'Gratis',
    price: 0,
    period: 'mes',
    description: 'Ideal para empezar y probar la plataforma',
    limits: [
      'Tiendas: 1',
      'Productos/tienda: 10',
      'Categorías/tienda: 3'
    ],
    features: [
      { name: 'Analíticas: Básicas', included: true },
      { name: 'Soporte Prioritario', included: true },
      { name: 'Filtrar Estadísticas', included: false },
      { name: 'Instagram en Catálogo', included: false },
      { name: 'Colores de Tema Personalizados', included: false },
      { name: 'Dirección en Catálogo', included: true },
      { name: 'Marca de Agua "Tutaviendo"', included: true }
    ],
    popular: false,
    current: true
  },
  {
    id: 'emprendedor',
    name: 'Emprendedor',
    price: 4.99,
    period: 'mes',
    description: 'Perfecto para negocios en crecimiento',
    limits: [
      'Tiendas: 2',
      'Productos/tienda: 30',
      'Categorías/tienda: ilimitadas'
    ],
    features: [
      { name: 'Analíticas: Avanzadas', included: true },
      { name: 'Soporte Prioritario', included: true },
      { name: 'Filtrar Estadísticas', included: true },
      { name: 'Instagram en Catálogo', included: true },
      { name: 'Colores de Tema Personalizados', included: true },
      { name: 'Dirección en Catálogo', included: true },
      { name: 'Marca de Agua "Tutaviendo"', included: false }
    ],
    popular: true,
    current: false
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 9.99,
    period: 'mes',
    description: 'Todas las herramientas para escalar tu negocio',
    limits: [
      'Tiendas: 5',
      'Productos/tienda: 50',
      'Categorías/tienda: ilimitadas'
    ],
    features: [
      { name: 'Analíticas: Completas', included: true },
      { name: 'Soporte Prioritario', included: true },
      { name: 'Filtrar Estadísticas', included: true },
      { name: 'Instagram en Catálogo', included: true },
      { name: 'Colores de Tema Personalizados', included: true },
      { name: 'Dirección en Catálogo', included: true },
      { name: 'Marca de Agua "Tutaviendo"', included: false }
    ],
    popular: false,
    current: false
  }
];

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
    icon: Shield,
    title: 'Soporte Prioritario',
    description: 'Soporte técnico prioritario con respuesta rápida'
  }
];

export default function SubscriptionPage() {
  const { state, dispatch } = useStore();
  const { success, error } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('emprendedor');
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentPlan = state.user?.plan || 'gratuito';
  const isCurrentlyPremium = currentPlan === 'emprendedor' || currentPlan === 'profesional';

  // Actualizar los planes para marcar el plan actual
  useEffect(() => {
    plans.forEach(plan => {
      plan.current = plan.id === currentPlan;
    });
    setIsLoading(false);
  }, [currentPlan]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    
    // Si el plan seleccionado es premium y el usuario no tiene un plan premium actualmente
    if ((planId === 'emprendedor' || planId === 'profesional') && currentPlan === 'gratuito') {
      setShowPayment(true);
    }
    
    // Si el usuario ya tiene un plan premium y quiere cambiar a otro plan premium
    else if ((planId === 'emprendedor' || planId === 'profesional') && 
             (currentPlan === 'emprendedor' || currentPlan === 'profesional') && 
             planId !== currentPlan) {
      // Mostrar confirmación para cambiar entre planes premium
      if (window.confirm(`¿Estás seguro de que quieres cambiar al plan ${planId === 'emprendedor' ? 'Emprendedor' : 'Profesional'}?`)) {
        handlePlanChange(planId);
      }
    }
    
    // Si el usuario quiere volver al plan gratuito desde un plan premium
    else if (planId === 'gratuito' && (currentPlan === 'emprendedor' || currentPlan === 'profesional')) {
      if (window.confirm('¿Estás seguro de que quieres volver al plan gratuito? Perderás todas las funciones premium.')) {
        handleDowngrade();
      }
    }
  };

  const handlePlanChange = async (newPlan: string) => {
    setIsProcessing(true);
    
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('No se encontró el usuario');
      }
      
      // Calculate subscription end date (30 days from now)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
      
      // Update user in database with new plan information
      const { error: updateError } = await supabase
        .from('users')
        .update({
          plan: newPlan as 'emprendedor' | 'profesional',
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: subscriptionEndDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      const updatedUser = {
        ...state.user!,
        plan: newPlan as 'emprendedor' | 'profesional',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      const planName = newPlan === 'emprendedor' ? 'Emprendedor' : 'Profesional';
      success(
        `¡Plan actualizado a ${planName}!`,
        'Tu suscripción se ha actualizado correctamente'
      );
      
      // Redirect to dashboard after a moment
      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);
      
    } catch (err: any) {
      console.error('Plan change error:', err);
      error('Error al cambiar plan', err.message || 'No se pudo cambiar el plan. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDowngrade = async () => {
    setIsProcessing(true);
    
    try {
      // Verificar si el usuario tiene más de una tienda
      if (state.stores.length > 1) {
        error(
          'No se puede cambiar al plan gratuito',
          'Debes eliminar tiendas adicionales antes de cambiar al plan gratuito. El plan gratuito solo permite una tienda.'
        );
        setIsProcessing(false);
        return;
      }
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('No se encontró el usuario');
      }
      
      // Update user in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          plan: 'gratuito',
          subscription_status: 'canceled',
          subscription_canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      const updatedUser = {
        ...state.user!,
        plan: 'gratuito',
        subscriptionStatus: 'canceled',
        subscriptionCanceledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      success(
        'Plan cambiado a gratuito',
        'Tu suscripción ha sido cancelada y has vuelto al plan gratuito'
      );
      
      // Redirect to dashboard after a moment
      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);
      
    } catch (err: any) {
      console.error('Downgrade error:', err);
      error('Error al cambiar plan', err.message || 'No se pudo cambiar al plan gratuito. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    setIsProcessing(true);
    
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('No se encontró el usuario');
      }
      
      // Calculate subscription end date (30 days from now)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
      
      // Update user in database with new plan information
      const { error: updateError } = await supabase
        .from('users')
        .update({
          plan: selectedPlan as 'emprendedor' | 'profesional',
          subscription_id: `sub_${Date.now()}`,
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: subscriptionEndDate.toISOString(),
          payment_method: paymentData.method,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      const updatedUser = {
        ...state.user!,
        plan: selectedPlan as 'emprendedor' | 'profesional',
        subscriptionId: `sub_${Date.now()}`,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        paymentMethod: paymentData.method,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      const planName = plans.find(p => p.id === selectedPlan)?.name || 'Premium';
      success(
        `¡Bienvenido al plan ${planName}!`, 
        'Tu suscripción se ha activado correctamente. Ya puedes acceder a todas las funciones de tu plan.'
      );
      
      setShowPayment(false);
      
      // Redirect to dashboard after a moment
      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);
      
    } catch (err: any) {
      console.error('Payment error:', err);
      error('Error en el pago', err.message || 'No se pudo procesar el pago. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 admin-dark:text-gray-300">Cargando información de suscripción...</p>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <PaymentMethodForm
        plan={plans.find(p => p.id === selectedPlan)!}
        onBack={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        isProcessing={isProcessing}
      />
    );
  }

  if (isCurrentlyPremium) {
    return <ActiveSubscription />;
  }

  return (
    <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white admin-dark:bg-gray-800 border-b border-gray-200 admin-dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900 admin-dark:text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 admin-dark:text-white">Planes y Precios</h1>
              <p className="text-gray-600 admin-dark:text-gray-300 mt-1">Elige el plan perfecto para tu negocio</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 admin-dark:from-indigo-900/30 admin-dark:to-purple-900/30 text-indigo-700 admin-dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            Actualiza tu Plan
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 admin-dark:text-white mb-4">
            Desbloquea Todo el Potencial de Tutaviendo
          </h2>
          <p className="text-lg text-gray-600 admin-dark:text-gray-300 max-w-2xl mx-auto">
            Desde tiendas básicas hasta negocios profesionales, tenemos el plan perfecto para cada etapa de tu crecimiento
          </p>
        </div>

        {/* Plans Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white admin-dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all ${
                plan.popular
                  ? 'border-indigo-500 scale-105 lg:scale-110'
                  : 'border-gray-200 admin-dark:border-gray-700'
              } ${
                selectedPlan === plan.id ? 'ring-4 ring-indigo-200 admin-dark:ring-indigo-800' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="p-6 lg:p-8">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 admin-dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-600 admin-dark:text-gray-300 mb-4 text-sm">{plan.description}</p>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-4xl font-bold text-gray-900 admin-dark:text-white">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600 admin-dark:text-gray-300">/{plan.period}</span>
                    )}
                  </div>

                  {plan.id === 'gratuito' && currentPlan === 'gratuito' && (
                    <span className="inline-block bg-green-100 admin-dark:bg-green-900 text-green-800 admin-dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                      Plan Actual
                    </span>
                  )}
                </div>

                {/* Limits */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 admin-dark:text-white mb-3 text-sm">Límites:</h4>
                  <ul className="space-y-2">
                    {plan.limits.map((limit, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700 admin-dark:text-gray-300">{limit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <h4 className="font-semibold text-gray-900 admin-dark:text-white text-sm">Características:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span className={`${feature.included ? 'text-gray-700 admin-dark:text-gray-300' : 'text-gray-400 admin-dark:text-gray-500'}`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={(plan.id === 'gratuito' && currentPlan === 'gratuito') || isProcessing}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                    isProcessing 
                      ? 'bg-gray-300 admin-dark:bg-gray-600 text-gray-500 admin-dark:text-gray-400 cursor-not-allowed'
                      : plan.popular
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transform hover:scale-105'
                        : plan.id === 'gratuito' && currentPlan === 'gratuito'
                          ? 'bg-gray-100 admin-dark:bg-gray-700 text-gray-500 admin-dark:text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 admin-dark:bg-gray-700 hover:bg-gray-200 admin-dark:hover:bg-gray-600 text-gray-700 admin-dark:text-gray-300'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    plan.id === 'gratuito' && currentPlan === 'gratuito'
                      ? 'Plan Actual'
                      : plan.price > 0
                        ? `Actualizar a ${plan.name}`
                        : 'Plan Gratuito'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Features Detail */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 admin-dark:border-gray-700 p-6 lg:p-8 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 admin-dark:text-white mb-4">
              ¿Por qué elegir un plan de pago?
            </h3>
            <p className="text-gray-600 admin-dark:text-gray-300">
              Descubre todas las ventajas que obtienes con nuestros planes Emprendedor y Profesional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 admin-dark:from-indigo-900/30 admin-dark:to-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-indigo-600 admin-dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 admin-dark:text-white mb-2">{feature.title}</h4>
                  <p className="text-gray-600 admin-dark:text-gray-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 admin-dark:bg-gray-800/50 rounded-2xl p-6 lg:p-8">
          <h3 className="text-xl font-bold text-gray-900 admin-dark:text-white mb-6 text-center">
            Preguntas Frecuentes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 admin-dark:text-white mb-2">
                ¿Puedo cambiar de plan en cualquier momento?
              </h4>
              <p className="text-gray-600 admin-dark:text-gray-300 text-sm">
                Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican inmediatamente.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 admin-dark:text-white mb-2">
                ¿Qué métodos de pago aceptan?
              </h4>
              <p className="text-gray-600 admin-dark:text-gray-300 text-sm">
                Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express) y PayPal.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 admin-dark:text-white mb-2">
                ¿Hay garantía de devolución?
              </h4>
              <p className="text-gray-600 admin-dark:text-gray-300 text-sm">
                Ofrecemos una garantía de devolución de 30 días. Si no estás satisfecho, te devolvemos tu dinero.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 admin-dark:text-white mb-2">
                ¿Qué pasa si excedo los límites?
              </h4>
              <p className="text-gray-600 admin-dark:text-gray-300 text-sm">
                Te notificaremos cuando te acerques a los límites y podrás actualizar tu plan fácilmente.
              </p>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 admin-dark:text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Pagos seguros con encriptación SSL de 256 bits</span>
          </div>
        </div>
      </div>
    </div>
  );
}

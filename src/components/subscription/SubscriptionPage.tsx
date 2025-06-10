import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Check, CreditCard, Star, Shield, Zap, X, Store, Package, Palette, BarChart3, Instagram, Eye } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import PaymentForm from '../payment/PaymentForm';
import ActiveSubscription from './ActiveSubscription';

export default function SubscriptionPage() {
  const { state, dispatch, getUserPlan } = useStore();
  const { success, error } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] =  useState(true);

  // Obtener planes dinámicamente
  const { plans } = state;
  
  // Obtener plan actual del usuario
  const userPlan = getUserPlan(state.user);
  const currentPlan = userPlan?.id || 'gratuito';
  
  // Determinar si el usuario tiene un plan premium
  const isCurrentlyPremium = userPlan && !userPlan.isFree;

  // Actualizar los planes para marcar el plan actual
  useEffect(() => {
    if (plans.length > 0) {
      // Establecer el plan seleccionado por defecto
      if (!selectedPlan) {
        // Si el usuario tiene un plan gratuito, seleccionar el primer plan premium
        if (!isCurrentlyPremium) {
          const firstPremiumPlan = plans.find(p => !p.isFree && p.isActive);
          if (firstPremiumPlan) {
            setSelectedPlan(firstPremiumPlan.id);
          }
        } else {
          // Si ya tiene un plan premium, seleccionar el siguiente nivel
          const nextLevel = userPlan ? userPlan.level + 1 : 2;
          const nextPlan = plans.find(p => p.level === nextLevel && p.isActive);
          if (nextPlan) {
            setSelectedPlan(nextPlan.id);
          } else {
            // Si no hay siguiente nivel, seleccionar el plan actual
            setSelectedPlan(currentPlan);
          }
        }
      }
      setIsLoading(false);
    }
  }, [plans, currentPlan, isCurrentlyPremium, userPlan, selectedPlan]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    
    // Si el plan seleccionado es premium y el usuario no tiene un plan premium actualmente
    if (planId !== 'gratuito' && !isCurrentlyPremium) {
      setShowPayment(true);
    }
    
    // Si el usuario ya tiene un plan premium y quiere cambiar a otro plan premium
    else if (planId !== 'gratuito' && isCurrentlyPremium && planId !== currentPlan) {
      // Mostrar confirmación para cambiar entre planes premium
      if (window.confirm(`¿Estás seguro de que quieres cambiar al plan ${planId}?`)) {
        handlePlanChange(planId);
      }
    }
    
    // Si el usuario quiere volver al plan gratuito desde un plan premium
    else if (planId === 'gratuito' && isCurrentlyPremium) {
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
          plan: newPlan,
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
        plan: newPlan,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      // Obtener nombre del plan dinámicamente
      const selectedPlanObj = plans.find(p => p.id === newPlan);
      const planName = selectedPlanObj?.name || newPlan;
      
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
          plan: selectedPlan,
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
        plan: selectedPlan,
        subscriptionId: `sub_${Date.now()}`,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        paymentMethod: paymentData.method,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      // Obtener nombre del plan dinámicamente
      const selectedPlanObj = plans.find(p => p.id === selectedPlan);
      const planName = selectedPlanObj?.name || 'Premium';
      
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

  if (isLoading || plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 admin-dark:text-gray-300">Cargando información de suscripción...</p>
        </div>
      </div>
    );
  }

  if (showPayment && selectedPlan) {
    const selectedPlanObj = plans.find(p => p.id === selectedPlan);
    
    if (!selectedPlanObj) {
      return (
        <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 admin-dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 admin-dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 admin-dark:text-white mb-2">
              Plan no encontrado
            </h2>
            <p className="text-gray-600 admin-dark:text-gray-300 mb-4">
              No se pudo encontrar el plan seleccionado. Por favor intenta de nuevo.
            </p>
            <button
              onClick={() => setShowPayment(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Volver a Planes
            </button>
          </div>
        </div>
      );
    }
    
    // Usar el nuevo componente PaymentForm para Stripe
    return (
      <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900">
        <div className="bg-white admin-dark:bg-gray-800 border-b border-gray-200 admin-dark:border-gray-700">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPayment(false)}
                className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-900 admin-dark:text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 admin-dark:text-white">Pago Seguro</h1>
                <p className="text-gray-600 admin-dark:text-gray-300 mt-1">Completa tu suscripción al plan {selectedPlanObj.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
            {/* Usar el componente de Stripe */}
            <PaymentForm 
              planId={selectedPlanObj.id}
              userId={state.user?.id || ''}
              planName={selectedPlanObj.name}
              planPrice={selectedPlanObj.price}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPayment(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isCurrentlyPremium) {
    return <ActiveSubscription />;
  }

  // Mostrar planes dinámicamente
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
    },
  ];

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

        {/* Plans Comparison - DYNAMIC */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {plans.filter(plan => plan.isActive).map((plan) => {
            const isPlanPopular = plan.level === 2; // Nivel 2 suele ser el plan popular
            const isUserCurrentPlan = plan.id === currentPlan;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white admin-dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all ${
                  isPlanPopular
                    ? 'border-indigo-500 scale-105 lg:scale-110'
                    : 'border-gray-200 admin-dark:border-gray-700'
                } ${
                  selectedPlan === plan.id ? 'ring-4 ring-indigo-200 admin-dark:ring-indigo-800' : ''
                }`}
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
                    <h3 className="text-2xl font-bold text-gray-900 admin-dark:text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-600 admin-dark:text-gray-300 mb-4 text-sm">{plan.description}</p>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-4xl font-bold text-gray-900 admin-dark:text-white">
                        ${plan.price.toFixed(2)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-600 admin-dark:text-gray-300">/mes</span>
                      )}
                    </div>

                    {isUserCurrentPlan && (
                      <span className="inline-block bg-green-100 admin-dark:bg-green-900 text-green-800 admin-dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                        Plan Actual
                      </span>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 admin-dark:text-white mb-3 text-sm">Límites:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700 admin-dark:text-gray-300">
                          Tiendas: {plan.maxStores === 999999 ? '∞' : plan.maxStores}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700 admin-dark:text-gray-300">
                          Productos/tienda: {plan.maxProducts === 999999 ? '∞' : plan.maxProducts}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700 admin-dark:text-gray-300">
                          Categorías/tienda: {plan.maxCategories === 999999 ? '∞' : plan.maxCategories}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    <h4 className="font-semibold text-gray-900 admin-dark:text-white text-sm">Características:</h4>
                    <ul className="space-y-2">
                      {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700 admin-dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={(plan.id === currentPlan) || isProcessing}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                      isProcessing 
                        ? 'bg-gray-300 admin-dark:bg-gray-600 text-gray-500 admin-dark:text-gray-400 cursor-not-allowed'
                        : plan.id === currentPlan
                          ? 'bg-gray-100 admin-dark:bg-gray-700 text-gray-500 admin-dark:text-gray-400 cursor-not-allowed'
                          : isPlanPopular
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transform hover:scale-105'
                            : plan.isFree
                              ? 'bg-gray-100 admin-dark:bg-gray-700 hover:bg-gray-200 admin-dark:hover:bg-gray-600 text-gray-700 admin-dark:text-gray-300'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      plan.id === currentPlan
                        ? 'Plan Actual'
                        : plan.isFree
                          ? 'Plan Gratuito'
                          : `Actualizar a ${plan.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Premium Features Detail */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 admin-dark:border-gray-700 p-6 lg:p-8 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 admin-dark:text-white mb-4">
              ¿Por qué elegir un plan de pago?
            </h3>
            <p className="text-gray-600 admin-dark:text-gray-300">
              Descubre todas las ventajas que obtienes con nuestros planes premium
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
                Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express) a través de Stripe, nuestro procesador de pagos seguro.
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
            <span>Pagos seguros con Stripe y encriptación SSL de 256 bits</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <path d="M12 9v4"></path>
      <path d="M12 17h.01"></path>
    </svg>
  );
}
import React, { useState } from 'react';
import { Crown, CreditCard } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';

export default function ActiveSubscription() {
  const { state } = useStore();
  const { error } = useToast();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const user = state.user;
  const userPlan = state.plans.find(p => p.id === user?.plan);

  const handleOpenBillingPortal = async () => {
    setIsLoadingPortal(true);
    try {
      if (!user?.stripeCustomerId) {
        throw new Error('No tienes un cliente de Stripe asociado. Si ya te suscribiste, contacta soporte.');
      }

      const response = await fetch('https://dpggztqltotvvfqmlvny.supabase.co/functions/v1/create-portal-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ 
          customerId: user.stripeCustomerId,
          returnUrl: window.location.origin + '/subscription'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al abrir el portal de pagos');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se pudo obtener la URL del portal de pagos');
      }
    } catch (err: any) {
      console.error('Error al abrir portal:', err);
      error('Error al abrir portal', err.message || 'No se pudo abrir el portal de pagos. Por favor intenta de nuevo.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 admin-dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 admin-dark:text-white">
                Tu Suscripción Actual
              </h2>
              <p className="text-gray-600 admin-dark:text-gray-300 mt-1">
                {userPlan?.name || 'Plan Gratuito'}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 admin-dark:from-indigo-900/30 admin-dark:to-purple-900/30 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-indigo-600 admin-dark:text-indigo-400" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 admin-dark:bg-gray-700/50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 admin-dark:text-white">Estado de la Suscripción</h3>
                <p className="text-sm text-gray-600 admin-dark:text-gray-300">
                  {user?.subscriptionStatus === 'active' ? 'Activa' : 'Inactiva'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user?.subscriptionStatus === 'active'
                  ? 'bg-green-100 text-green-800 admin-dark:bg-green-900/30 admin-dark:text-green-400'
                  : 'bg-red-100 text-red-800 admin-dark:bg-red-900/30 admin-dark:text-red-400'
              }`}>
                {user?.subscriptionStatus === 'active' ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            {user?.subscriptionEndDate && (
              <div className="flex items-center justify-between p-4 bg-gray-50 admin-dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 admin-dark:text-white">Próxima Facturación</h3>
                  <p className="text-sm text-gray-600 admin-dark:text-gray-300">
                    {new Date(user.subscriptionEndDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {user?.stripeCustomerId ? (
              <button
                onClick={handleOpenBillingPortal}
                disabled={isLoadingPortal}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPortal ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Cargando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Gestionar Suscripción
                  </span>
                )}
              </button>
            ) : (
              <div className="text-red-600 text-sm font-medium">
                No tienes un cliente de Stripe asociado. Si ya te suscribiste y ves este mensaje, contacta soporte.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
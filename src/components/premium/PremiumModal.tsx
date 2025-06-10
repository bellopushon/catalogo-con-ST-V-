import React, { useState } from 'react';
import { X, Crown, Store, Package, Palette, BarChart3, Headphones, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';

interface PremiumModalProps {
  onClose: () => void;
}

export default function PremiumModal({ onClose }: PremiumModalProps) {
  const { state, getUserPlan } = useStore();
  
  // Obtener planes disponibles
  const availablePlans = state.plans.filter(p => p.isActive && !p.isFree);
  
  // Obtener plan actual del usuario
  const userPlan = getUserPlan(state.user);
  
  // Determinar el siguiente plan recomendado
  const getNextRecommendedPlan = () => {
    if (!userPlan) return availablePlans[0];
    
    // Si el usuario ya tiene un plan premium, recomendar el siguiente nivel
    if (!userPlan.isFree) {
      const nextLevel = userPlan.level + 1;
      const nextPlan = availablePlans.find(p => p.level === nextLevel);
      return nextPlan || availablePlans[availablePlans.length - 1]; // El último si no hay siguiente
    }
    
    // Si es plan gratuito, recomendar el primer plan premium
    return availablePlans[0];
  };
  
  const recommendedPlan = getNextRecommendedPlan();

  const premiumFeatures = [
    {
      icon: Store,
      title: 'Múltiples Tiendas',
      description: recommendedPlan ? `Crea hasta ${recommendedPlan.maxStores} tiendas diferentes con catálogos únicos` : 'Crea múltiples tiendas con catálogos únicos'
    },
    {
      icon: Package,
      title: 'Más Productos y Categorías',
      description: recommendedPlan ? `Hasta ${recommendedPlan.maxProducts} productos por tienda` : 'Más productos por tienda'
    },
    {
      icon: Palette,
      title: 'Personalización Avanzada',
      description: 'Colores personalizados y sin marca de agua'
    },
    {
      icon: BarChart3,
      title: 'Analíticas Completas',
      description: 'Estadísticas avanzadas con filtros detallados'
    },
    {
      icon: Headphones,
      title: 'Soporte Prioritario',
      description: 'Soporte técnico prioritario con respuesta rápida'
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white admin-dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 admin-dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 admin-dark:text-white">¡Desbloquea Más Tiendas!</h2>
                <p className="text-gray-600 admin-dark:text-gray-300">Expande tu negocio con el plan Premium</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500 admin-dark:text-gray-400" />
            </button>
          </div>
        </div>

{/* Content */}
<div className="p-6">
 {/* Current Limitation */}
 <div className="bg-orange-700 admin-dark:bg-orange-700 border border-orange-600 admin-dark:border-orange-600 rounded-lg p-4 mb-6">
   <div className="flex items-center gap-3">
     <div className="w-8 h-8 bg-orange-600 admin-dark:bg-orange-600 rounded-full flex items-center justify-center">
       <Store className="w-4 h-4 text-white" />
     </div>
     <div>
       <h3 className="font-semibold text-white">Has alcanzado el límite de tu plan {userPlan?.name || 'Gratuito'}</h3>
       <p className="text-sm text-orange-100">
         {userPlan ? 
           `Actualmente tienes ${state.stores.length}/${userPlan.maxStores} tiendas. Actualiza para crear más.` :
           'Actualiza para crear más tiendas.'}
       </p>
     </div>
   </div>
 </div>

          {/* Features List */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">¿Qué obtienes con Premium?</h3>
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 admin-dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 admin-dark:bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-indigo-600 admin-dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 admin-dark:text-white mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600 admin-dark:text-gray-300">{feature.description}</p>
                </div>
                <div className="text-green-500 flex-shrink-0">
                  <Check className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 admin-dark:from-indigo-900/20 admin-dark:to-purple-900/20 rounded-xl p-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-2">
                {recommendedPlan ? `Plan ${recommendedPlan.name}` : 'Plan Premium'}
              </h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-bold text-gray-900 admin-dark:text-white">
                  ${recommendedPlan ? recommendedPlan.price.toFixed(2) : '9.99'}
                </span>
                <span className="text-gray-600 admin-dark:text-gray-300">/mes</span>
              </div>
              <p className="text-sm text-gray-600 admin-dark:text-gray-300">
                Facturación mensual • Cancela cuando quieras
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/subscription"
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-all transform hover:scale-105 text-center"
            >
              Ver Planes y Precios
            </Link>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 admin-dark:bg-gray-700 hover:bg-gray-200 admin-dark:hover:bg-gray-600 text-gray-700 admin-dark:text-gray-300 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Quizás Más Tarde
            </button>
          </div>

          {/* Guarantee */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 admin-dark:text-gray-400">
              💰 Garantía de devolución de 30 días • 🔒 Pago seguro con SSL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
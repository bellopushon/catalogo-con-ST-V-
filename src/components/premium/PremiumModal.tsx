import React from 'react';
import { X, Crown, Store, Package, Palette, BarChart3, Headphones, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PremiumModalProps {
  onClose: () => void;
}

const premiumFeatures = [
  {
    icon: Store,
    title: 'Múltiples Tiendas',
    description: 'Crea hasta 10 tiendas diferentes con catálogos únicos'
  },
  {
    icon: Package,
    title: 'Más Productos y Categorías',
    description: 'Sin límites en productos y categorías por tienda'
  },
  {
    icon: Palette,
    title: 'Temas Avanzados',
    description: 'Acceso a temas premium y personalización avanzada'
  },
  {
    icon: BarChart3,
    title: 'Analíticas Detalladas',
    description: 'Estadísticas avanzadas de visitas, productos y ventas'
  },
  {
    icon: Headphones,
    title: 'Soporte Prioritario',
    description: 'Soporte técnico 24/7 con respuesta prioritaria'
  },
];

export default function PremiumModal({ onClose }: PremiumModalProps) {
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
       <h3 className="font-semibold text-white">Has alcanzado el límite de tu plan Gratis</h3>
       <p className="text-sm text-orange-100">Actualmente tienes 1/1 tiendas. Actualiza para crear más.</p>
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
              <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-2">Plan Premium</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-bold text-gray-900 admin-dark:text-white">$19</span>
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

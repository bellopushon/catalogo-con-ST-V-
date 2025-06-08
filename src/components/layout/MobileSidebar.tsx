import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Palette, 
  CreditCard, 
  Store, 
  X,
  ShoppingBag,
  Eye,
  Crown,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';

// Solo las opciones que NO están en el menú inferior
const navigationItems = [
  { icon: Palette, label: 'Diseño de la Tienda', href: '/admin/design' },
  { icon: CreditCard, label: 'Pagos y Envíos', href: '/admin/payments-shipping' },
  { icon: Store, label: 'Gestionar Tiendas', href: '/admin/stores' },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const location = useLocation();
  const { state } = useStore();

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose} 
      />
      
      {/* Sidebar - FIXED DARK MODE */}
      <div className="relative w-80 max-w-[85vw] bg-white admin-dark:bg-gray-900 h-full overflow-y-auto">
        {/* Header - FIXED DARK MODE */}
        <div className="p-6 border-b border-gray-200 admin-dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 admin-dark:text-white">Tutaviendo</h1>
                <p className="text-xs text-gray-500 admin-dark:text-gray-400">WhatsApp Catalogs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-900 admin-dark:text-white" />
            </button>
          </div>
        </div>

        {/* Quick Action - Solo Ver Catálogo - FIXED DARK MODE */}
        {state.currentStore && (
          <div className="p-4 border-b border-gray-200 admin-dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 admin-dark:text-white mb-3">Acción Rápida</h3>
            <Link
              to={`/store/${state.currentStore.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors"
            >
              <Eye className="w-5 h-5" />
              <span className="font-medium">Ver Catálogo</span>
            </Link>
          </div>
        )}

        {/* Navigation - FIXED DARK MODE HOVER STATES */}
        <nav className="p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 admin-dark:text-white mb-3">Configuración Avanzada</h3>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 admin-dark:bg-indigo-900 text-indigo-700 admin-dark:text-indigo-300 border-l-4 border-indigo-700 admin-dark:border-indigo-400'
                    : 'text-gray-700 admin-dark:text-gray-300 hover:bg-gray-50 admin-dark:hover:bg-gray-800 hover:text-gray-900 admin-dark:hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium flex-1">{item.label}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            );
          })}
        </nav>

        {/* Plan Info - FIXED DARK MODE */}
        <div className="p-4 border-t border-gray-200 admin-dark:border-gray-700 mt-auto">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 admin-dark:from-gray-800 admin-dark:to-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                state.user?.plan === 'profesional' ? 'bg-purple-500' :
                state.user?.plan === 'emprendedor' ? 'bg-blue-500' : 'bg-gray-400'
              }`}></div>
              <span className="font-semibold text-gray-900 admin-dark:text-white">
                Plan {
                  state.user?.plan === 'profesional' ? 'Profesional' :
                  state.user?.plan === 'emprendedor' ? 'Emprendedor' : 'Gratis'
                }
              </span>
            </div>
            <p className="text-sm text-gray-600 admin-dark:text-gray-300 mb-3">
              {state.user?.plan === 'profesional' 
                ? 'Tienes acceso a todas las funciones profesionales'
                : state.user?.plan === 'emprendedor'
                ? 'Tienes acceso a funciones avanzadas'
                : 'Actualiza para desbloquear más funciones'
              }
            </p>
            {state.user?.plan === 'gratuito' && (
              <Link
                to="/subscription"
                onClick={onClose}
                className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium text-center hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Actualizar Plan
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

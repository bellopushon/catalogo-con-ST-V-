import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  FolderOpen, 
  DollarSign, 
  BarChart3, 
  ShoppingCart,
  Plus,
  Settings,
  Zap,
  Palette,
  Wrench,
  Eye,
  Copy,
  TrendingUp,
  MessageCircle,
  Store,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { formatCurrency } from '../../utils/constants';
import StatsCard from './StatsCard';
import DateRangeFilter, { DateRange } from './DateRangeFilter';

export default function Dashboard() {
  const { state } = useStore();
  const { getVisits, getOrders, getOrderValue } = useAnalytics();
  const store = state.currentStore;

  // Default to "Hoy" for all users
  const getDefaultDateRange = (): DateRange => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    return {
      start: startOfDay,
      end: endOfDay,
      label: 'Hoy'
    };
  };

  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(getDefaultDateRange());

  const userPlan = state.user?.plan || 'gratuito';
  const canUseAdvancedFilters = userPlan === 'emprendedor' || userPlan === 'profesional';

  // Calculate analytics for current store (with fallbacks for no store)
  const analytics = useMemo(() => {
    if (!store) return { visits: 0, orders: 0, orderValue: 0 };

    const dateRange = canUseAdvancedFilters ? selectedDateRange : getDefaultDateRange();
    
    return {
      visits: getVisits(store.id, dateRange),
      orders: getOrders(store.id, dateRange),
      orderValue: getOrderValue(store.id, dateRange)
    };
  }, [store, selectedDateRange, canUseAdvancedFilters, getVisits, getOrders, getOrderValue]);

  // Stats with fallbacks for no store scenario
  const stats = [
    {
      label: 'Productos Totales',
      value: store?.products?.length || 0,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 admin-dark:bg-blue-900/20',
      textColor: 'text-blue-600 admin-dark:text-blue-400',
      description: store ? 'En tu inventario' : 'Crea tu primera tienda'
    },
    {
      label: 'Categorías Activas',
      value: store?.categories?.length || 0,
      icon: FolderOpen,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 admin-dark:bg-green-900/20',
      textColor: 'text-green-600 admin-dark:text-green-400',
      description: store ? 'Para organizar productos' : 'Organiza tus productos'
    },
    {
      label: 'Moneda',
      value: store?.currency || 'USD',
      icon: DollarSign,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 admin-dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 admin-dark:text-yellow-400',
      description: store?.currency === 'USD' ? 'Dólar estadounidense' : 'Moneda configurada'
    },
    {
      label: 'Visitas al Catálogo',
      value: analytics.visits,
      icon: BarChart3,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 admin-dark:bg-purple-900/20',
      textColor: 'text-purple-600 admin-dark:text-purple-400',
      description: `Visitas (${selectedDateRange.label.toLowerCase()})`
    },
    {
      label: 'Pedidos Realizados',
      value: analytics.orders,
      icon: MessageCircle,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50 admin-dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 admin-dark:text-indigo-400',
      description: `Pedidos (${selectedDateRange.label.toLowerCase()})`
    },
    {
      label: 'Valor de Pedidos',
      value: formatCurrency(analytics.orderValue, store?.currency || 'USD'),
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 admin-dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 admin-dark:text-emerald-400',
      description: `Total vendido (${selectedDateRange.label.toLowerCase()})`
    }
  ];

  const quickActions = [
    {
      label: store ? 'Añadir Producto' : 'Crear Tienda',
      icon: store ? Plus : Store,
      href: store ? '/admin/products?new=true' : '/admin/add-store',
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      label: 'Ajustes Generales',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-600 hover:bg-gray-700',
      disabled: !store
    },
    {
      label: 'Tema Visual',
      icon: Zap,
      href: '/admin/design',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      disabled: !store
    },
    {
      label: 'Ver Catálogo',
      icon: Eye,
      href: store ? `/store/${store.slug}` : '#',
      color: 'bg-purple-600 hover:bg-purple-700',
      disabled: !store
    },
  ];

  const copyStoreLink = async () => {
    if (!store) return;
    
    const storeUrl = `${window.location.origin}/store/${store.slug}`;
    try {
      await navigator.clipboard.writeText(storeUrl);
      alert('¡Enlace copiado al portapapeles!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = storeUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          ¡Hola, {state.user?.name}! 👋
        </h1>
        <p className="text-indigo-100 text-base lg:text-lg mb-4">
          {store ? 'Bienvenido de vuelta a tu panel.' : 'Comienza creando tu primera tienda.'}
        </p>
        
        {/* Copy Store Link Button - Only show if store exists */}
        {store && (
          <button
            onClick={copyStoreLink}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
          >
            <Copy className="w-4 h-4" />
            Copiar Enlace de Tienda
          </button>
        )}
      </div>

      {/* No Store Warning */}
      {!store && (
        <div className="bg-amber-50 admin-dark:bg-amber-900/20 border border-amber-200 admin-dark:border-amber-700 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 admin-dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600 admin-dark:text-amber-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 admin-dark:text-amber-100 mb-1">
                ¡Crea tu primera tienda!
              </h3>
              <p className="text-amber-800 admin-dark:text-amber-200 text-sm">
                Para comenzar a usar Tutaviendo, necesitas crear al menos una tienda. Es rápido y fácil.
              </p>
            </div>
            <Link
              to="/admin/add-store"
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              Crear Tienda
            </Link>
          </div>
        </div>
      )}

      {/* Key Stats Section - Always show */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 admin-dark:text-white">Estadísticas Clave</h2>
          {store && (
            <DateRangeFilter
              selectedRange={selectedDateRange}
              onRangeChange={setSelectedDateRange}
              userPlan={userPlan}
            />
          )}
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              bgColor={stat.bgColor}
              textColor={stat.textColor}
              description={stat.description}
            />
          ))}
        </div>

        {/* Plan Limitation Notice - Only show if store exists */}
        {store && !canUseAdvancedFilters && (
          <div className="mt-4 p-4 bg-amber-50 admin-dark:bg-amber-900/20 border border-amber-200 admin-dark:border-amber-700 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-amber-700 admin-dark:text-amber-300" />
              <div>
                <h4 className="font-medium text-amber-900 admin-dark:text-amber-100">
                  Filtros Avanzados Disponibles
                </h4>
                <p className="text-sm text-amber-800 admin-dark:text-amber-200">
                  Actualiza tu plan para acceder a filtros de tiempo personalizados y analíticas más detalladas.
                </p>
              </div>
              <Link
                to="/subscription"
                className="bg-amber-700 hover:bg-amber-800 admin-dark:bg-amber-600 admin-dark:hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Ver Planes
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <div className="hidden lg:block">
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 admin-dark:text-white mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              action.disabled ? (
                <div
                  key={index}
                  className="bg-gray-300 admin-dark:bg-gray-600 text-gray-500 admin-dark:text-gray-400 p-4 rounded-lg text-center opacity-50 cursor-not-allowed"
                >
                  <action.icon className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
              ) : (
                <Link
                  key={index}
                  to={action.href}
                  className={`${action.color} text-white p-4 rounded-lg text-center transition-all hover:scale-105 hover:shadow-lg`}
                >
                  <action.icon className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started - Always show, different content based on store existence */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 admin-dark:from-gray-800 admin-dark:to-gray-900 rounded-xl border-2 border-dashed border-green-200 admin-dark:border-green-800 p-6 lg:p-8">
        <div className="text-center">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white mb-3">
            {store ? '¡Sigue Creciendo!' : '¡Empieza a Usar Tutaviendo!'}
          </h2>
          <p className="text-gray-800 admin-dark:text-gray-100 mb-6 text-sm lg:text-base max-w-2xl mx-auto">
            {store 
              ? 'Añade más productos, personaliza el diseño y comparte tu catálogo con más clientes.'
              : 'Configura tu tienda en pocos pasos: crea tu tienda, añade productos y comparte tu catálogo.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {store ? (
              <>
                <Link
                  to="/admin/products?new=true"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm lg:text-base"
                >
                  Añadir Producto
                </Link>
                <Link
                  to="/admin/design"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm lg:text-base"
                >
                  Personalizar Diseño
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/admin/add-store"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm lg:text-base"
                >
                  Crear Mi Primera Tienda
                </Link>
                <Link
                  to="/subscription"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm lg:text-base"
                >
                  Ver Planes Premium
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  Settings, 
  Palette, 
  CreditCard, 
  Store, 
  Menu,
  X,
  ShoppingBag,
  Eye,
  ChevronDown,
  ChevronUp,
  Plus,
  Crown
} from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import PremiumModal from '../premium/PremiumModal';

const navigationItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Package, label: 'Productos', href: '/admin/products' },
  { icon: FolderOpen, label: 'Categorías', href: '/admin/categories' },
  { icon: Settings, label: 'Ajustes Generales', href: '/admin/settings' },
  { icon: Palette, label: 'Diseño de la Tienda', href: '/admin/design' },
  { icon: CreditCard, label: 'Pagos y Envíos', href: '/admin/payments-shipping' },
  { icon: Store, label: 'Gestionar Tiendas', href: '/admin/stores' },
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const storeSelectorRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { state, dispatch } = useStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (storeSelectorRef.current && !storeSelectorRef.current.contains(event.target as Node)) {
        setShowStoreSelector(false);
      }
    }

    if (showStoreSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStoreSelector]);

  const handleStoreChange = (store: any) => {
    dispatch({ type: 'SET_CURRENT_STORE', payload: store });
    setShowStoreSelector(false);
  };

  // ✅ FIXED: Correct logic for store creation limits
  const canCreateStore = () => {
    const userPlan = state.user?.plan || 'gratuito';
    const currentStoreCount = state.stores.length;
    
    switch (userPlan) {
      case 'gratuito':
        return currentStoreCount < 1;
      case 'emprendedor':
        return currentStoreCount < 2;
      case 'profesional':
        return currentStoreCount < 5;
      default:
        return false;
    }
  };

  const getMaxStores = () => {
    const userPlan = state.user?.plan || 'gratuito';
    switch (userPlan) {
      case 'gratuito': return 1;
      case 'emprendedor': return 2;
      case 'profesional': return 5;
      default: return 1;
    }
  };

  const handleAddStore = () => {
    if (canCreateStore()) {
      // User can create more stores, redirect to add store page
      window.location.href = '/admin/add-store';
    } else {
      // User has reached their limit, show premium modal
      setShowPremiumModal(true);
      setShowStoreSelector(false);
    }
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white admin-dark:bg-gray-800 border-r border-gray-200 admin-dark:border-gray-700">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 admin-dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 admin-dark:text-white">Tutaviendo</h1>
            <p className="text-xs text-gray-500 admin-dark:text-gray-400">WhatsApp Catalogs</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-indigo-50 admin-dark:bg-indigo-900/50 text-indigo-700 admin-dark:text-indigo-300 border-l-4 border-indigo-700 admin-dark:border-indigo-400'
                  : 'text-gray-700 admin-dark:text-gray-300 hover:bg-gray-50 admin-dark:hover:bg-gray-700 hover:text-gray-900 admin-dark:hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium flex-1">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Ver Catálogo Button - Beautiful gradient design */}
        {state.currentStore && (
          <Link
            to={`/store/${state.currentStore.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Eye className="w-5 h-5" />
            <span className="flex-1">Ver Catálogo</span>
          </Link>
        )}
      </nav>

      {/* Store Selector - Improved Design with Upward Dropdown */}
      {state.currentStore && (
        <div className="border-t border-gray-200 admin-dark:border-gray-700 relative" ref={storeSelectorRef}>
          {/* Store Selector Dropdown - Opens Upward */}
          {showStoreSelector && (
            <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-white admin-dark:bg-gray-800 border border-gray-200 admin-dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 admin-dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 admin-dark:text-white">Cambiar Tienda</h3>
                  <span className="text-xs text-gray-500 admin-dark:text-gray-400 bg-gray-100 admin-dark:bg-gray-700 px-2 py-1 rounded-full">
                    {state.stores.length} / {getMaxStores()}
                  </span>
                </div>
              </div>

              {/* Store List */}
              <div className="max-h-60 overflow-y-auto p-2">
                <div className="space-y-1">
                  {state.stores.map(store => (
                    <button
                      key={store.id}
                      onClick={() => handleStoreChange(store)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        state.currentStore?.id === store.id
                          ? 'border-indigo-200 admin-dark:border-indigo-700 bg-indigo-50 admin-dark:bg-indigo-900/30 text-indigo-700 admin-dark:text-indigo-300'
                          : 'border-transparent hover:border-gray-200 admin-dark:hover:border-gray-600 hover:bg-gray-50 admin-dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        state.currentStore?.id === store.id
                          ? 'bg-indigo-100 admin-dark:bg-indigo-800'
                          : 'bg-gray-100 admin-dark:bg-gray-600'
                      }`}>
                        <Store className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={store.name}>
                          {store.name}
                        </p>
                        <p className="text-xs text-gray-500 admin-dark:text-gray-400">
                          {store.products?.length || 0} productos
                        </p>
                      </div>

                      {state.currentStore?.id === store.id && (
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      )}
                    </button>
                  ))}

                  {/* Add Store Button - ✅ FIXED: Dynamic text based on user's ability to create stores */}
                  <button
                    onClick={handleAddStore}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed transition-all ${
                      canCreateStore()
                        ? 'border-indigo-300 admin-dark:border-indigo-600 text-indigo-600 admin-dark:text-indigo-400 hover:border-indigo-400 admin-dark:hover:border-indigo-500 hover:bg-indigo-50 admin-dark:hover:bg-indigo-900/20'
                        : 'border-gray-300 admin-dark:border-gray-600 text-gray-500 admin-dark:text-gray-400 hover:border-gray-400 admin-dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 admin-dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-sm">
                        {state.stores.length === 0 ? 'Primera Tienda' : 'Nueva Tienda'}
                      </p>
                      <p className="text-xs">
                        {canCreateStore()
                          ? 'Crear ahora'
                          : 'Requiere actualizar plan'
                        }
                      </p>
                    </div>

                    {!canCreateStore() && (
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Store Selector Trigger */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 admin-dark:text-white">Mis Tiendas</h3>
              <span className="text-xs text-gray-500 admin-dark:text-gray-400 bg-gray-100 admin-dark:bg-gray-700 px-2 py-1 rounded-full">
                {state.stores.length} / {getMaxStores()}
              </span>
            </div>

            {/* Current Store Display */}
            <button
              onClick={() => setShowStoreSelector(!showStoreSelector)}
              className="w-full flex items-center gap-3 hover:bg-gray-50 admin-dark:hover:bg-gray-700 rounded-lg p-3 transition-colors border border-gray-200 admin-dark:border-gray-600"
            >
              <div className="w-10 h-10 bg-indigo-100 admin-dark:bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-indigo-600 admin-dark:text-indigo-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 admin-dark:text-white truncate" title={state.currentStore.name}>
                  {state.currentStore.name}
                </p>
                <p className="text-xs text-gray-500 admin-dark:text-gray-400">
                  {state.currentStore.products?.length || 0} productos
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {showStoreSelector ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white admin-dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 admin-dark:border-gray-700"
      >
        <Menu className="w-6 h-6 text-gray-900 admin-dark:text-white" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="relative w-64 bg-white admin-dark:bg-gray-800 h-full">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-900 admin-dark:text-white" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}
    </>
  );
}

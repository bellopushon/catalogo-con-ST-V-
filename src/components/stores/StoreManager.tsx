import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Plus, 
  MoreVertical, 
  Settings, 
  Trash2, 
  Eye,
  Package,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';

export default function StoreManager() {
  const { state, dispatch } = useStore();
  const { success, error } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<any>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get plan limits
  const canCreateStore = () => {
    const userPlan = state.user?.plan || 'gratuito';
    const currentStoreCount = state.stores?.length || 0;
    
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

  const handleDeleteStore = async (store: any) => {
    setStoreToDelete(store);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;

    setIsDeleting(true);

    try {
      // Check if this is the last store and user is on a paid plan
      if ((state.stores?.length === 1) && (state.user?.plan === 'emprendedor' || state.user?.plan === 'profesional')) {
        error(
          'No puedes eliminar tu única tienda',
          'Los usuarios con plan de pago deben tener al menos una tienda activa.'
        );
        setIsDeleting(false);
        setShowDeleteModal(false);
        return;
      }

      // Delete the store
      dispatch({ type: 'DELETE_STORE', payload: storeToDelete.id });

      success(
        'Tienda eliminada',
        `La tienda "${storeToDelete.name}" ha sido eliminada correctamente.`
      );

      setShowDeleteModal(false);
      setStoreToDelete(null);
    } catch (err) {
      console.error('Error deleting store:', err);
      error('Error al eliminar', 'No se pudo eliminar la tienda. Intenta de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSwitchStore = (store: any) => {
    dispatch({ type: 'SET_CURRENT_STORE', payload: store });
    success('Tienda cambiada', `Ahora estás gestionando "${store.name}"`);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Gestionar Tiendas</h1>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">
            Administra todas tus tiendas desde un solo lugar
          </p>
        </div>
        
        {/* Store Counter */}
        <div className="text-right">
          <div className="text-sm text-gray-500 admin-dark:text-gray-400">Tiendas</div>
          <div className="text-2xl font-bold text-gray-900 admin-dark:text-white">
            {state.stores?.length || 0} / {getMaxStores()}
          </div>
        </div>
      </div>

      {/* Add New Store Button */}
      {canCreateStore() && (
        <Link
          to="/admin/add-store"
          className="flex items-center gap-3 p-4 lg:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 admin-dark:from-indigo-900/20 admin-dark:to-purple-900/20 border-2 border-dashed border-indigo-300 admin-dark:border-indigo-600 rounded-xl hover:border-indigo-400 admin-dark:hover:border-indigo-500 hover:bg-indigo-50 admin-dark:hover:bg-indigo-900/30 transition-all group"
        >
          <div className="w-12 h-12 bg-indigo-100 admin-dark:bg-indigo-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-indigo-600 admin-dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 admin-dark:text-white">
              {(state.stores?.length === 0) ? 'Crear Primera Tienda' : 'Añadir Nueva Tienda'}
            </h3>
            <p className="text-sm text-gray-600 admin-dark:text-gray-300">
              Expande tu negocio con un nuevo catálogo
            </p>
          </div>
        </Link>
      )}

      {/* Stores List */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700">
        <div className="p-4 lg:p-6 border-b border-gray-200 admin-dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Tus Tiendas</h2>
        </div>

        {(state.stores?.length === 0) ? (
          <div className="p-8 lg:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 admin-dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 admin-dark:text-white mb-2">No tienes tiendas</h3>
            <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mb-6">
              Crea tu primera tienda para empezar a vender
            </p>
            <Link
              to="/admin/add-store"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Primera Tienda
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 admin-dark:divide-gray-700">
            {state.stores?.map((store) => (
              <div key={store.id} className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Store Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      state.currentStore?.id === store.id
                        ? 'bg-indigo-100 admin-dark:bg-indigo-900'
                        : 'bg-gray-100 admin-dark:bg-gray-700'
                    }`}>
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="w-8 h-8 object-contain rounded-lg"
                        />
                      ) : (
                        <Store className={`w-6 h-6 ${
                          state.currentStore?.id === store.id
                            ? 'text-indigo-600 admin-dark:text-indigo-400'
                            : 'text-gray-500 admin-dark:text-gray-400'
                        }`} />
                      )}
                    </div>

                    {/* Store Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900 admin-dark:text-white text-base lg:text-lg truncate">
                          {store.name}
                        </h3>
                        {state.currentStore?.id === store.id && (
                          <span className="bg-green-100 admin-dark:bg-green-900 text-green-800 admin-dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                            Actual
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 admin-dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>{store.products?.length || 0} productos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>/{store.slug}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Quick Actions - Desktop */}
                    <div className="hidden lg:flex items-center gap-2">
                      {state.currentStore?.id !== store.id && (
                        <button
                          onClick={() => handleSwitchStore(store)}
                          className="px-3 py-2 text-sm font-medium text-indigo-600 admin-dark:text-indigo-400 hover:bg-indigo-50 admin-dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        >
                          Cambiar a esta tienda
                        </button>
                      )}
                      
                      <Link
                        to={`/store/${store.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 admin-dark:text-gray-400 hover:text-purple-600 admin-dark:hover:text-purple-400 hover:bg-purple-50 admin-dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Ver catálogo"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>

                      <Link
                        to="/admin/settings"
                        onClick={() => handleSwitchStore(store)}
                        className="p-2 text-gray-600 admin-dark:text-gray-400 hover:text-blue-600 admin-dark:hover:text-blue-400 hover:bg-blue-50 admin-dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Configurar tienda"
                      >
                        <Settings className="w-5 h-5" />
                      </Link>

                      <button
                        onClick={() => handleDeleteStore(store)}
                        className="p-2 text-gray-600 admin-dark:text-gray-400 hover:text-red-600 admin-dark:hover:text-red-400 hover:bg-red-50 admin-dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar tienda"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Dropdown Menu - Mobile */}
                    <div className="lg:hidden relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === store.id ? null : store.id)}
                        className="p-2 text-gray-600 admin-dark:text-gray-400 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {openDropdown === store.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white admin-dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 admin-dark:border-gray-600 z-10">
                          {state.currentStore?.id !== store.id && (
                            <button
                              onClick={() => {
                                handleSwitchStore(store);
                                setOpenDropdown(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 admin-dark:text-gray-300 hover:bg-gray-50 admin-dark:hover:bg-gray-700 transition-colors"
                            >
                              <Store className="w-4 h-4" />
                              Cambiar a esta tienda
                            </button>
                          )}
                          
                          <Link
                            to={`/store/${store.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpenDropdown(null)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 admin-dark:text-gray-300 hover:bg-gray-50 admin-dark:hover:bg-gray-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Catálogo
                          </Link>

                          <Link
                            to="/admin/settings"
                            onClick={() => {
                              handleSwitchStore(store);
                              setOpenDropdown(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 admin-dark:text-gray-300 hover:bg-gray-50 admin-dark:hover:bg-gray-700 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Configurar Tienda
                          </Link>

                          <button
                            onClick={() => {
                              handleDeleteStore(store);
                              setOpenDropdown(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 admin-dark:text-red-400 hover:bg-red-50 admin-dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar Tienda
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Prompt - FIXED DARK MODE */}
      {!canCreateStore() && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Has alcanzado el límite de tu plan
              </h3>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                Actualiza tu plan para crear más tiendas y acceder a funciones avanzadas
              </p>
            </div>
            <Link
              to="/subscription"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
            >
              Ver Planes
            </Link>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && storeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white admin-dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 admin-dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 admin-dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 admin-dark:text-white">
                  ¿Eliminar tienda?
                </h2>
                <p className="text-gray-600 admin-dark:text-gray-300">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="bg-gray-50 admin-dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-gray-500 admin-dark:text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900 admin-dark:text-white">{storeToDelete.name}</h3>
                  <p className="text-sm text-gray-600 admin-dark:text-gray-300">
                    {storeToDelete.products?.length || 0} productos serán eliminados
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 admin-dark:bg-red-900/20 border border-red-200 admin-dark:border-red-800 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-red-800 admin-dark:text-red-200 mb-2">
                ⚠️ Advertencia
              </h4>
              <ul className="text-sm text-red-700 admin-dark:text-red-300 space-y-1">
                <li>• Todos los productos serán eliminados permanentemente</li>
                <li>• Las categorías se perderán</li>
                <li>• El catálogo público dejará de funcionar</li>
                <li>• Esta acción no se puede deshacer</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStoreToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border border-gray-300 admin-dark:border-gray-600 text-gray-700 admin-dark:text-gray-300 rounded-lg hover:bg-gray-50 admin-dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteStore}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sí, Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
}

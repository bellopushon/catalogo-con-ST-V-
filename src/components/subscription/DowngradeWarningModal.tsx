import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Store } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

interface DowngradeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  newPlan: string;
  excessStores: number;
}

export default function DowngradeWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentPlan, 
  newPlan, 
  excessStores 
}: DowngradeWarningModalProps) {
  const { state, dispatch } = useStore();
  const { success, error } = useToast();
  const [selectedStoreToDelete, setSelectedStoreToDelete] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDeleteStore = async () => {
    if (!selectedStoreToDelete) {
      error('Selección requerida', 'Por favor selecciona una tienda para eliminar');
      return;
    }

    setIsDeleting(true);

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('No user found');
      }
      
      // Delete the store from database
      const { error: deleteError } = await supabase
        .from('stores')
        .delete()
        .eq('id', selectedStoreToDelete)
        .eq('user_id', currentUser.id);

      if (deleteError) {
        throw deleteError;
      }
      
      // Remove the selected store from local state
      const updatedStores = state.stores.filter(store => store.id !== selectedStoreToDelete);
      dispatch({ type: 'SET_STORES', payload: updatedStores });

      // If the deleted store was the current one, set a new current store
      if (state.currentStore?.id === selectedStoreToDelete && updatedStores.length > 0) {
        dispatch({ type: 'SET_CURRENT_STORE', payload: updatedStores[0] });
      }

      success('Tienda eliminada', 'La tienda ha sido eliminada correctamente');
      
      // Continue with the cancellation/downgrade
      onConfirm();
    } catch (err: any) {
      console.error('Error deleting store:', err);
      error('Error al eliminar', err.message || 'No se pudo eliminar la tienda. Intenta de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const planNames = {
    gratuito: 'Gratis',
    emprendedor: 'Emprendedor',
    profesional: 'Profesional'
  };

  const getMaxStores = (plan: string) => {
    switch (plan) {
      case 'gratuito': return 1;
      case 'emprendedor': return 2;
      case 'profesional': return 5;
      default: return 1;
    }
  };

  const maxStoresAfterDowngrade = getMaxStores(newPlan);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white admin-dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 admin-dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600 admin-dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 admin-dark:text-white">
                Límite de Tiendas Excedido
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 admin-dark:text-gray-400" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 admin-dark:text-gray-300 mb-4">
            Al cambiar al plan <strong>{planNames[newPlan]}</strong>, solo puedes tener <strong>{maxStoresAfterDowngrade} tienda{maxStoresAfterDowngrade > 1 ? 's' : ''}</strong>. 
            Actualmente tienes <strong>{state.stores.length} tiendas</strong>.
          </p>
          
          <div className="bg-yellow-50 admin-dark:bg-yellow-900/20 border border-yellow-200 admin-dark:border-yellow-800 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-yellow-800 admin-dark:text-yellow-200 mb-2">
              Debes eliminar {excessStores} tienda{excessStores > 1 ? 's' : ''}
            </h4>
            <p className="text-sm text-yellow-700 admin-dark:text-yellow-300">
              Selecciona qué tienda deseas eliminar. Esta acción no se puede deshacer.
            </p>
          </div>

          {/* Store Selection */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 admin-dark:text-white">Selecciona la tienda a eliminar:</h4>
            {state.stores.map(store => (
              <label
                key={store.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedStoreToDelete === store.id
                    ? 'border-red-300 bg-red-50 admin-dark:bg-red-900/20 admin-dark:border-red-700'
                    : 'border-gray-200 admin-dark:border-gray-600 hover:border-gray-300 admin-dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="storeToDelete"
                  value={store.id}
                  checked={selectedStoreToDelete === store.id}
                  onChange={(e) => setSelectedStoreToDelete(e.target.value)}
                  className="text-red-600 focus:ring-red-500"
                />
                <div className="w-8 h-8 bg-gray-100 admin-dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Store className="w-4 h-4 text-gray-600 admin-dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 admin-dark:text-white">{store.name}</h5>
                  <p className="text-sm text-gray-600 admin-dark:text-gray-300">
                    {store.products?.length || 0} productos
                  </p>
                </div>
                {selectedStoreToDelete === store.id && (
                  <Trash2 className="w-4 h-4 text-red-500" />
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 border border-gray-300 admin-dark:border-gray-600 text-gray-700 admin-dark:text-gray-300 rounded-lg hover:bg-gray-50 admin-dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteStore}
            disabled={!selectedStoreToDelete || isDeleting}
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
                Eliminar y Continuar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

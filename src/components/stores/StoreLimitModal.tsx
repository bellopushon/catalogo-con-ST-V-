import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { AlertTriangle } from 'lucide-react';

interface StoreLimitModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function StoreLimitModal({ isOpen, onClose }: StoreLimitModalProps) {
  const { state, getMaxStores, loadUserStores, suspendStores } = useStore();
  const maxStores = getMaxStores();
  const activeStores = state.stores.filter(store => store.status === 'active');
  const suspendedStores = state.stores.filter(store => store.status === 'suspended');
  const [selectedId, setSelectedId] = useState<string>(activeStores[0]?.id || '');
  const [loading, setLoading] = useState(false);

  // Cerrar el modal automáticamente si ya solo hay una tienda activa o el límite permitido
  React.useEffect(() => {
    if (activeStores.length <= maxStores && isOpen) {
      if (onClose) onClose();
    }
  }, [activeStores.length, maxStores, isOpen, onClose]);

  // Si no hay más de una tienda activa, no mostrar el modal
  if (!isOpen || activeStores.length <= 1) return null;

  const handleSelect = (storeId: string) => {
    setSelectedId(storeId);
  };

  const handleConfirm = async () => {
    setLoading(true);
    const toSuspend = activeStores
      .filter(store => store.id !== selectedId)
      .map(store => store.id);
    await suspendStores(toSuspend);
    if (state.user && state.user.id) {
      await loadUserStores(state.user.id);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="bg-amber-100 rounded-full p-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Límite de tiendas alcanzado</h2>
          <p className="text-gray-700 mb-6">
            Tu plan actual solo permite <span className="font-semibold">{maxStores} tienda{maxStores > 1 ? 's' : ''}</span> activa{maxStores > 1 ? 's' : ''}.<br />
            Selecciona cuáles tiendas deseas mantener activas. Las demás serán desactivadas y podrás reactivarlas si actualizas tu plan.
          </p>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {activeStores.map(store => (
              <button
                key={store.id}
                type="button"
                className={`border rounded-xl p-4 flex flex-col items-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500
                  ${selectedId === store.id
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-indigo-400'}
                `}
                onClick={() => handleSelect(store.id)}
                disabled={loading}
              >
                <span className="font-semibold text-gray-900 mb-1">{store.name}</span>
                <span className="text-xs text-gray-500">{store.slug}</span>
                <span className="mt-2 text-xs text-indigo-600 font-medium">
                  <input
                    type="radio"
                    checked={selectedId === store.id}
                    onChange={() => handleSelect(store.id)}
                    className="mr-2 accent-indigo-600"
                    disabled={loading}
                  />
                  {selectedId === store.id ? 'Seleccionada' : 'Seleccionar'}
                </span>
              </button>
            ))}
          </div>
          <button
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors text-lg
              ${selectedId && activeStores.length > 1 && !loading ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}
            onClick={handleConfirm}
            disabled={!selectedId || activeStores.length <= 1 || loading}
          >
            {loading ? 'Guardando...' : 'Confirmar selección'}
          </button>
        </div>
      </div>
    </div>
  );
}
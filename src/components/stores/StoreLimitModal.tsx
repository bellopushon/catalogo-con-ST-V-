import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { AlertTriangle } from 'lucide-react';

interface StoreLimitModalProps {
  isOpen: boolean;
}

export default function StoreLimitModal({ isOpen }: StoreLimitModalProps) {
  const { state, getMaxStores, suspendStores } = useStore();
  const maxStores = getMaxStores();
  const activeStores = state.stores.filter(store => store.status === 'active');
  const suspendedStores = state.stores.filter(store => store.status === 'suspended');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    activeStores.slice(-maxStores).map(store => store.id)
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (storeId: string) => {
    if (selectedIds.includes(storeId)) {
      setSelectedIds(selectedIds.filter(id => id !== storeId));
    } else if (selectedIds.length < maxStores) {
      setSelectedIds([...selectedIds, storeId]);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    const toSuspend = activeStores
      .filter(store => !selectedIds.includes(store.id))
      .map(store => store.id);
    await suspendStores(toSuspend);
    setLoading(false);
    window.location.reload(); // Forzar recarga para evitar inconsistencias
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
                className={`border rounded-xl p-4 flex flex-col items-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500
                  ${selectedIds.includes(store.id)
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-indigo-400'}
                `}
                onClick={() => handleSelect(store.id)}
                disabled={loading}
              >
                <span className="font-semibold text-gray-900 mb-1">{store.name}</span>
                <span className="text-xs text-gray-500">{store.slug}</span>
                {selectedIds.includes(store.id) && (
                  <span className="mt-2 text-xs text-indigo-600 font-medium">Seleccionada</span>
                )}
              </button>
            ))}
          </div>
          <button
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors text-lg
              ${selectedIds.length === maxStores && !loading ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}
            onClick={handleConfirm}
            disabled={selectedIds.length !== maxStores || loading}
          >
            {loading ? 'Guardando...' : 'Confirmar selección'}
          </button>
        </div>
      </div>
    </div>
  );
} 
import React, { useState } from 'react';
import { CreditCard, Truck, Store, DollarSign, Save } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';

export default function PaymentsShipping() {
  const { state, updateStore } = useStore();
  const { success, error } = useToast();
  const store = state.currentStore;

  const [paymentMethods, setPaymentMethods] = useState({
    cash: store?.acceptCash ?? true,
    bankTransfer: store?.acceptBankTransfer ?? false,
    bankDetails: store?.bankDetails || '',
  });

  const [shippingMethods, setShippingMethods] = useState({
    pickup: store?.allowPickup ?? true,
    delivery: store?.allowDelivery ?? false,
    deliveryCost: store?.deliveryCost || 0,
    deliveryZone: store?.deliveryZone || '',
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePaymentChange = (field: string, value: any) => {
    setPaymentMethods(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleShippingChange = (field: string, value: any) => {
    setShippingMethods(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!store) return;

    setIsSaving(true);

    try {
      // Preparar datos para actualizar
      const updateData = {
        acceptCash: paymentMethods.cash,
        acceptBankTransfer: paymentMethods.bankTransfer,
        bankDetails: paymentMethods.bankDetails.trim() || undefined,
        allowPickup: shippingMethods.pickup,
        allowDelivery: shippingMethods.delivery,
        deliveryCost: shippingMethods.deliveryCost,
        deliveryZone: shippingMethods.deliveryZone.trim() || undefined,
      };

      // Actualizar tienda en Supabase
      await updateStore(updateData);

      setHasUnsavedChanges(false);
      success('¡Configuración guardada!', 'Los cambios de pagos y envíos se han aplicado correctamente');
    } catch (err: any) {
      console.error('Error saving payment/shipping settings:', err);
      error('Error al guardar', err.message || 'No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show message if no store is available
  if (!store) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Pagos y Envíos</h1>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">Configure los métodos de pago y entrega</p>
        </div>
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-8 lg:p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 admin-dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 admin-dark:text-white mb-2">No hay tienda configurada</h3>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base">Primero debes configurar tu tienda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Pagos y Envíos</h1>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">Configure los métodos de pago y entrega</p>
        </div>
        
        {/* Save Button - Always Visible */}
        <button
          onClick={handleSaveChanges}
          disabled={isSaving || !hasUnsavedChanges}
          className={`flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-all ${
            hasUnsavedChanges
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
              : 'bg-gray-100 admin-dark:bg-gray-700 text-gray-400 admin-dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">
                {hasUnsavedChanges ? 'Guardar Cambios' : 'Sin Cambios'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 admin-dark:bg-yellow-900/20 border border-yellow-200 admin-dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <p className="text-yellow-800 admin-dark:text-yellow-200 text-sm font-medium">
              Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos permanentemente.
            </p>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4 lg:mb-6">
          <CreditCard className="w-6 h-6 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Métodos de Pago</h2>
        </div>

        <div className="space-y-6">
          {/* Cash Payment */}
          <div className="flex items-center justify-between p-4 border border-gray-200 admin-dark:border-gray-600 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="font-medium text-gray-900 admin-dark:text-white">Efectivo</h3>
                <p className="text-sm text-gray-600 admin-dark:text-gray-300">Pago en efectivo al momento de la entrega</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentMethods.cash}
                onChange={(e) => handlePaymentChange('cash', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Bank Transfer */}
          <div className="border border-gray-200 admin-dark:border-gray-600 rounded-lg">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-medium text-gray-900 admin-dark:text-white">Transferencia Bancaria</h3>
                  <p className="text-sm text-gray-600 admin-dark:text-gray-300">Pago mediante transferencia bancaria</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.bankTransfer}
                  onChange={(e) => handlePaymentChange('bankTransfer', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {paymentMethods.bankTransfer && (
              <div className="px-4 pb-4 border-t border-gray-100 admin-dark:border-gray-600">
                <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2 mt-4">
                  Datos Bancarios
                </label>
                <textarea
                  value={paymentMethods.bankDetails}
                  onChange={(e) => handlePaymentChange('bankDetails', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                  placeholder="Incluye información como:
- Nombre del banco
- Número de cuenta
- Nombre del titular
- Tipo de cuenta"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Methods */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4 lg:mb-6">
          <Truck className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Métodos de Entrega</h2>
        </div>

        <div className="space-y-6">
          {/* Store Pickup */}
          <div className="flex items-center justify-between p-4 border border-gray-200 admin-dark:border-gray-600 rounded-lg">
            <div className="flex items-center gap-3">
              <Store className="w-6 h-6 text-indigo-500" />
              <div>
                <h3 className="font-medium text-gray-900 admin-dark:text-white">Recogida en Tienda</h3>
                <p className="text-sm text-gray-600 admin-dark:text-gray-300">El cliente recoge el pedido en tu ubicación</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={shippingMethods.pickup}
                onChange={(e) => handleShippingChange('pickup', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Local Delivery */}
          <div className="border border-gray-200 admin-dark:border-gray-600 rounded-lg">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="font-medium text-gray-900 admin-dark:text-white">Entrega Local (Delivery)</h3>
                  <p className="text-sm text-gray-600 admin-dark:text-gray-300">Entrega a domicilio en tu zona de cobertura</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={shippingMethods.delivery}
                  onChange={(e) => handleShippingChange('delivery', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 admin-dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {shippingMethods.delivery && (
              <div className="px-4 pb-4 border-t border-gray-100 admin-dark:border-gray-600 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                      Costo de Delivery
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        value={shippingMethods.deliveryCost}
                        onChange={(e) => handleShippingChange('deliveryCost', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                      Zona de Cobertura
                    </label>
                    <input
                      type="text"
                      value={shippingMethods.deliveryZone}
                      onChange={(e) => handleShippingChange('deliveryZone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                      placeholder="Ej: Centro de la ciudad, Radio de 5km"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 admin-dark:from-gray-800 admin-dark:to-gray-900 rounded-xl border border-blue-200 admin-dark:border-blue-800 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">Resumen de Configuración</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 admin-dark:text-white mb-2">Métodos de Pago Activos:</h4>
            <ul className="space-y-1 text-sm text-gray-900 admin-dark:text-gray-100">
              {paymentMethods.cash && <li>• Efectivo</li>}
              {paymentMethods.bankTransfer && <li>• Transferencia Bancaria</li>}
              {!paymentMethods.cash && !paymentMethods.bankTransfer && (
                <li className="text-red-600 admin-dark:text-red-400">⚠️ No hay métodos de pago configurados</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 admin-dark:text-white mb-2">Métodos de Entrega Activos:</h4>
            <ul className="space-y-1 text-sm text-gray-900 admin-dark:text-gray-100">
              {shippingMethods.pickup && <li>• Recogida en Tienda</li>}
              {shippingMethods.delivery && (
                <li>• Delivery ({store?.currency === 'USD' ? '$' : store?.currency === 'EUR' ? '€' : '$'}{shippingMethods.deliveryCost})</li>
              )}
              {!shippingMethods.pickup && !shippingMethods.delivery && (
                <li className="text-red-600 admin-dark:text-red-400">⚠️ No hay métodos de entrega configurados</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-100 admin-dark:bg-blue-900/50 border border-blue-200 admin-dark:border-blue-700 rounded-lg">
          <p className="text-sm text-blue-800 admin-dark:text-blue-100 font-medium">
            💡 Los cambios se guardarán cuando hagas clic en "Guardar Cambios"
          </p>
        </div>
      </div>

      {/* Save Button - Mobile Fixed */}
      {hasUnsavedChanges && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando Cambios...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

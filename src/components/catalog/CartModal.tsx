import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, MessageCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/constants';
import { generateWhatsAppMessage, sendWhatsAppMessage } from '../../utils/whatsapp';
import { useAnalytics } from '../../contexts/AnalyticsContext';

interface CartModalProps {
  cart: any[];
  store: any;
  onClose: () => void;
  onUpdateCart: (cart: any[]) => void;
}

export default function CartModal({ cart, store, onClose, onUpdateCart }: CartModalProps) {
  const { trackEvent } = useAnalytics();
  const [customerData, setCustomerData] = useState({
    name: '',
    address: '',
    paymentMethod: 'cash',
    deliveryMethod: 'pickup',
    comments: '',
  });

  const [errors, setErrors] = useState({});

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    onUpdateCart(updatedCart);
  };

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    onUpdateCart(updatedCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryCost = customerData.deliveryMethod === 'delivery' ? (store.shippingMethods?.deliveryCost || 0) : 0;
  const total = subtotal + deliveryCost;

  const validateForm = () => {
    const newErrors: any = {};

    if (!customerData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = () => {
    if (!validateForm()) return;

    if (!store.whatsapp) {
      alert('Esta tienda no tiene configurado un número de WhatsApp');
      return;
    }

    const orderData = {
      items: cart,
      customerName: customerData.name,
      address: customerData.address,
      paymentMethod: customerData.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia Bancaria',
      deliveryMethod: customerData.deliveryMethod === 'pickup' ? 'Recogida en Tienda' : 'Envío a Domicilio',
      comments: customerData.comments,
      deliveryCost,
      currencyCode: store.currency,
      storeName: store.name,
    };

    // Track order event
    trackEvent({
      type: 'order',
      storeId: store.id,
      data: {
        orderValue: total,
        customerName: customerData.name,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        }))
      }
    });

    // Use the store's custom message template if available
    const messageTemplate = store.messageTemplate || undefined;
    const message = generateWhatsAppMessage(orderData, window.location.href, messageTemplate);
    sendWhatsAppMessage(store.whatsapp, message);
    
    // Clear cart and close modal
    onUpdateCart([]);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const isDeliverySelected = customerData.deliveryMethod === 'delivery';

  if (cart.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Carrito Vacío</h2>
          <p className="text-gray-600 mb-6">No tienes productos en tu carrito</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Tu Pedido</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Cart Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Productos</h3>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.mainImage ? (
                      <img
                        src={item.product.mainImage}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.product.price, store.currency)} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.product.price * item.quantity, store.currency)}
                    </p>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Información de Contacto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={customerData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Tu nombre"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {(store.paymentMethods?.cash || store.paymentMethods?.bankTransfer) && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Método de Pago</h3>
              <div className="space-y-2">
                {store.paymentMethods?.cash && (
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={customerData.paymentMethod === 'cash'}
                      onChange={handleInputChange}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">Efectivo</span>
                  </label>
                )}
                {store.paymentMethods?.bankTransfer && (
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bankTransfer"
                      checked={customerData.paymentMethod === 'bankTransfer'}
                      onChange={handleInputChange}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">Transferencia Bancaria</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Delivery Method */}
          {(store.shippingMethods?.pickup || store.shippingMethods?.delivery) && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Método de Entrega</h3>
              <div className="space-y-2">
                {store.shippingMethods?.pickup && (
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pickup"
                      checked={customerData.deliveryMethod === 'pickup'}
                      onChange={handleInputChange}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">Recogida en Tienda</span>
                  </label>
                )}
                {store.shippingMethods?.delivery && (
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="delivery"
                      checked={customerData.deliveryMethod === 'delivery'}
                      onChange={handleInputChange}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-medium">Envío a Domicilio</span>
                      {deliveryCost > 0 && (
                        <span className="text-sm text-gray-600 ml-2">
                          (+{formatCurrency(deliveryCost, store.currency)})
                        </span>
                      )}
                    </div>
                  </label>
                )}
              </div>

              {/* Delivery Address Alert */}
              {isDeliverySelected && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-1">Importante</h4>
                      <p className="text-sm text-amber-700">
                        Al realizar tu pedido, recuerda proporcionar tu dirección completa de entrega para que podamos procesar el envío correctamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentarios adicionales (opcional)
            </label>
            <textarea
              name="comments"
              value={customerData.comments}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Instrucciones especiales, preferencias, etc."
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Resumen del Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal, store.currency)}</span>
              </div>
              {deliveryCost > 0 && (
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span>{formatCurrency(deliveryCost, store.currency)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(total, store.currency)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar Pedido por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, Shield } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface PaymentMethodFormProps {
  plan: any;
  onBack: () => void;
  onSuccess: (paymentData: any) => void;
  isProcessing: boolean;
}

export default function PaymentMethodForm({ plan, onBack, onSuccess, isProcessing }: PaymentMethodFormProps) {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    email: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  });
  const [errors, setErrors] = useState<any>({});
  const { error } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('billing.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value
        }
      }));
    } else {
      // Format card number
      if (name === 'cardNumber') {
        const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
        setFormData(prev => ({ ...prev, [name]: formatted }));
      }
      // Format expiry date
      else if (name === 'expiryDate') {
        const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
        setFormData(prev => ({ ...prev, [name]: formatted }));
      }
      // Format CVV
      else if (name === 'cvv') {
        const formatted = value.replace(/\D/g, '').slice(0, 4);
        setFormData(prev => ({ ...prev, [name]: formatted }));
      }
      else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (selectedMethod === 'card') {
      if (!formData.cardNumber.replace(/\s/g, '') || formData.cardNumber.replace(/\s/g, '').length < 13) {
        newErrors.cardNumber = 'Número de tarjeta inválido';
      }

      if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Fecha de vencimiento inválida (MM/YY)';
      }

      if (!formData.cvv || formData.cvv.length < 3) {
        newErrors.cvv = 'CVV inválido';
      }

      if (!formData.cardName.trim()) {
        newErrors.cardName = 'Nombre en la tarjeta es requerido';
      }
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email válido es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      error('Error de validación', 'Por favor corrige los errores en el formulario');
      return;
    }

    const paymentData = {
      method: selectedMethod,
      plan: plan.id,
      amount: plan.price,
      ...formData
    };

    onSuccess(paymentData);
  };

  const handlePayPal = () => {
    // Simulate PayPal flow
    const paymentData = {
      method: 'paypal',
      plan: plan.id,
      amount: plan.price,
      email: formData.email
    };
    
    onSuccess(paymentData);
  };

  return (
    <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white admin-dark:bg-gray-800 border-b border-gray-200 admin-dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              disabled={isProcessing}
              className="p-2 hover:bg-gray-100 admin-dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900 admin-dark:text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 admin-dark:text-white">Información de Pago</h1>
              <p className="text-gray-600 admin-dark:text-gray-300 mt-1">Completa tu suscripción a {plan.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Order Summary */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">Resumen del Pedido</h2>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-200 admin-dark:border-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 admin-dark:text-white">Plan {plan.name}</h3>
              <p className="text-sm text-gray-600 admin-dark:text-gray-300">Facturación mensual</p>
            </div>
            <span className="text-xl font-bold text-gray-900 admin-dark:text-white">${plan.price}/mes</span>
          </div>
          
          <div className="flex items-center justify-between pt-3">
            <span className="font-semibold text-gray-900 admin-dark:text-white">Total</span>
            <span className="text-xl font-bold text-gray-900 admin-dark:text-white">${plan.price}/mes</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-6">Método de Pago</h2>
          
          {/* Payment Method Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setSelectedMethod('card')}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedMethod === 'card'
                  ? 'border-indigo-500 bg-indigo-50 admin-dark:bg-indigo-900/20'
                  : 'border-gray-200 admin-dark:border-gray-600 hover:border-gray-300 admin-dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-gray-700 admin-dark:text-gray-300" />
                <span className="font-medium text-gray-900 admin-dark:text-white">Tarjeta de Crédito/Débito</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod('paypal')}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedMethod === 'paypal'
                  ? 'border-indigo-500 bg-indigo-50 admin-dark:bg-indigo-900/20'
                  : 'border-gray-200 admin-dark:border-gray-600 hover:border-gray-300 admin-dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PP</span>
                </div>
                <span className="font-medium text-gray-900 admin-dark:text-white">PayPal</span>
              </div>
            </button>
          </div>

          {/* Payment Form */}
          {selectedMethod === 'card' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Card Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                    Número de Tarjeta *
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    maxLength={19}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 ${
                      errors.cardNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="1234 5678 9012 3456"
                  />
                  {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    maxLength={5}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 ${
                      errors.expiryDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="MM/YY"
                  />
                  {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    maxLength={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 ${
                      errors.cvv ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="123"
                  />
                  {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
                    Nombre en la Tarjeta *
                  </label>
                  <input
                    type="text"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 ${
                      errors.cardName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Juan Pérez"
                  />
                  {errors.cardName && <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 admin-dark:bg-green-900/20 border border-green-200 admin-dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600 admin-dark:text-green-400" />
                  <div>
                    <h4 className="font-medium text-green-800 admin-dark:text-green-200">Pago Seguro</h4>
                    <p className="text-sm text-green-700 admin-dark:text-green-300">
                      Tu información está protegida con encriptación SSL de 256 bits
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-4 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando Pago...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Completar Pago - ${plan.price}/mes
                  </>
                )}
              </button>
            </form>
          ) : (
            /* PayPal Option */
            <div className="text-center py-8">
              <div className="mb-6">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full max-w-md mx-auto px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:border-gray-600 admin-dark:text-white admin-dark:placeholder-gray-400 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Email para la factura"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              
              <button
                onClick={handlePayPal}
                disabled={isProcessing || !formData.email}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 px-8 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">PP</span>
                    </div>
                    Pagar con PayPal - ${plan.price}/mes
                  </>
                )}
              </button>
            </div>
          )}

          {/* Terms */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 admin-dark:text-gray-400">
              Al completar el pago, aceptas nuestros{' '}
              <a href="#" className="text-indigo-600 admin-dark:text-indigo-400 hover:underline">
                Términos de Servicio
              </a>{' '}
              y{' '}
              <a href="#" className="text-indigo-600 admin-dark:text-indigo-400 hover:underline">
                Política de Privacidad
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

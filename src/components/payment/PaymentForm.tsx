import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { Shield, CreditCard } from 'lucide-react';

interface PaymentFormProps {
  planId: string;
  userId: string;
  planName: string;
  planPrice: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentForm({ 
  planId, 
  userId, 
  planName, 
  planPrice, 
  onSuccess, 
  onCancel 
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { error: showError } = useToast();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      // Get API URL from environment variables
      const apiUrl = import.meta.env.VITE_SUPER_ADMIN_API_URL || '';
      
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }
      
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      const userToken = session?.access_token;
      
      if (!userToken) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      // Create payment session
      const response = await fetch(`${apiUrl}/functions/v1/stripe-create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          planId,
          userId,
          successUrl: `${window.location.origin}/payment/success?plan=${planId}`,
          cancelUrl: `${window.location.origin}/payment/cancel`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la sesión de pago');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      showError(
        'Error al procesar el pago', 
        error.message || 'No se pudo iniciar el proceso de pago. Intenta de nuevo más tarde.'
      );
      setIsLoading(false);
      
      if (onCancel) {
        onCancel();
      }
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 admin-dark:from-indigo-900/30 admin-dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-indigo-600 admin-dark:text-indigo-400" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 admin-dark:text-white mb-2">
          Suscripción al Plan {planName}
        </h3>
        <p className="text-gray-600 admin-dark:text-gray-300 mb-4">
          Serás redirigido a Stripe para completar tu pago de forma segura
        </p>
        <div className="text-3xl font-bold text-gray-900 admin-dark:text-white mb-2">
          ${planPrice.toFixed(2)}<span className="text-sm text-gray-500 admin-dark:text-gray-400">/mes</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 admin-dark:from-indigo-900/20 admin-dark:to-purple-900/20 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-600 admin-dark:text-indigo-400" />
          <div>
            <h4 className="font-medium text-gray-900 admin-dark:text-white text-left">Pago Seguro con Stripe</h4>
            <p className="text-sm text-gray-600 admin-dark:text-gray-300 text-left">
              Tus datos de pago están protegidos con encriptación SSL de 256 bits
            </p>
          </div>
        </div>
      </div>
      
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Procesando...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 10H21M7 15H8M12 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 18H19C20.1046 18 21 17.1046 21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Pagar con Stripe</span>
          </>
        )}
      </button>
      
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
      
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 text-gray-600 admin-dark:text-gray-300 hover:text-gray-800 admin-dark:hover:text-gray-100 transition-colors"
        >
          Cancelar y volver
        </button>
      )}
    </div>
  );
}
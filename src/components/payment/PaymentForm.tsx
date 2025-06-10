import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

// Cargar Stripe con la clave pública
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
      
      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      const userToken = session?.access_token;
      
      if (!userToken) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      // Crear sesión de pago en Stripe
      const response = await fetch(`${import.meta.env.VITE_SUPER_ADMIN_API_URL}/functions/v1/stripe-create-payment`, {
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
        throw new Error(errorData.message || 'Error al crear la sesión de pago');
      }

      const { url } = await response.json();
      
      // Redirigir a Stripe Checkout
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
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Suscripción al Plan {planName}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Serás redirigido a Stripe para completar tu pago de forma segura
        </p>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ${planPrice.toFixed(2)}<span className="text-sm text-gray-500 dark:text-gray-400">/mes</span>
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
      
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Pago seguro con encriptación SSL de 256 bits</span>
      </div>
      
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-6 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
        >
          Cancelar y volver
        </button>
      )}
    </div>
  );
}
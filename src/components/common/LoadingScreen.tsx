import React from 'react';
import { ShoppingBag } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo animado */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-white animate-bounce" />
          </div>
        </div>
        
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        
        {/* Mensaje */}
        <p className="text-gray-600 font-medium animate-pulse">
          Inicializando aplicación...
        </p>
        
        {/* Subtítulo */}
        <p className="text-gray-500 text-sm mt-2">
          Por favor, espere un momento
        </p>
      </div>
    </div>
  );
} 
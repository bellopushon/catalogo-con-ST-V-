import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/constants';
import { COLOR_PALETTES } from '../../contexts/ThemeContext';

interface ProductModalProps {
  product: any;
  store: any;
  onClose: () => void;
  onAddToCart: (product: any) => void;
}

export default function ProductModal({ product, store, onClose, onAddToCart }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [product.mainImage, ...product.gallery].filter(Boolean);
  const hasMultipleImages = images.length > 1;

  // Get current theme colors for dynamic styling
  const currentPalette = COLOR_PALETTES.find(p => p.id === (store.colorPalette || 'predeterminado')) || COLOR_PALETTES[0];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = () => {
    onAddToCart(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detalles del Producto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Image Gallery - 1080x1080 standard size */}
        <div className="relative">
          <div className="aspect-square w-full">
            {images.length > 0 ? (
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500">Sin imagen</span>
              </div>
            )}
          </div>
          
          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Image indicators */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{product.name}</h1>
          
          {/* Price with theme color */}
          <p 
            className="text-2xl font-bold mb-2"
            style={{ color: currentPalette.primary }}
          >
            {formatCurrency(product.price, store.currency)}
          </p>

          {product.shortDescription && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">{product.shortDescription}</p>
          )}

          {/* Featured Badge */}
          {product.isFeatured && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                ⭐ Producto Destacado
              </span>
            </div>
          )}

          {/* Add to Cart Button with theme color */}
          <button
            onClick={handleAddToCart}
            className="w-full text-white py-3 px-4 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: currentPalette.primary }}
          >
            Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}

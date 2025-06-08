import React, { useState } from 'react';
import { Palette, Smartphone, Save, Monitor, Check } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useTheme, COLOR_PALETTES } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { PRODUCTS_PER_PAGE_OPTIONS } from '../../utils/constants';

export default function ThemeCustomizer() {
  const { state, updateStore } = useStore();
  const { currentPalette, borderRadius, applyTheme } = useTheme();
  const { success, error } = useToast();
  const store = state.currentStore;
  
  const [selectedPalette, setSelectedPalette] = useState(store?.colorPalette || 'predeterminado');
  const [selectedRadius, setSelectedRadius] = useState(store?.borderRadius || 8);
  const [productsPerPage, setProductsPerPage] = useState(store?.productsPerPage || 12);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handlePaletteChange = (paletteId: string) => {
    setSelectedPalette(paletteId);
    setHasUnsavedChanges(true);
    // Apply theme immediately for preview
    applyTheme(paletteId, selectedRadius);
  };

  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    setHasUnsavedChanges(true);
    // Apply theme immediately for preview
    applyTheme(selectedPalette, radius);
  };

  const handleProductsPerPageChange = (count: number) => {
    setProductsPerPage(count);
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!store) return;

    setIsSaving(true);

    try {
      // Preparar datos para actualizar
      const updateData = {
        colorPalette: selectedPalette,
        borderRadius: selectedRadius,
        productsPerPage: productsPerPage,
      };

      // Actualizar tienda en Supabase
      await updateStore(updateData);

      // Apply the theme
      applyTheme(selectedPalette, selectedRadius);

      setHasUnsavedChanges(false);
      success('¡Configuración guardada!', 'Los cambios de diseño se han aplicado correctamente');
    } catch (err: any) {
      console.error('Error saving theme settings:', err);
      error('Error al guardar', err.message || 'No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPaletteData = COLOR_PALETTES.find(p => p.id === selectedPalette) || COLOR_PALETTES[0];

  // Show message if no store is available
  if (!store) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Diseño de la Tienda</h1>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">Personaliza la apariencia de tu catálogo</p>
        </div>
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-8 lg:p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 admin-dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 admin-dark:text-white mb-2">No hay tienda configurada</h3>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base">Primero debes configurar tu tienda para personalizar el diseño</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 admin-dark:text-white">Diseño de la Tienda</h1>
          <p className="text-gray-600 admin-dark:text-gray-300 mt-1">Personaliza la apariencia de tu catálogo</p>
        </div>
        
        {/* Save Button - Always Visible */}
        <button
          onClick={handleSaveChanges}
          disabled={isSaving || !hasUnsavedChanges}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            hasUnsavedChanges
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
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
        <div className="bg-amber-50 admin-dark:bg-amber-900/20 border border-amber-200 admin-dark:border-amber-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <p className="text-amber-800 admin-dark:text-amber-200 text-sm font-medium">
              Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos.
            </p>
          </div>
        </div>
      )}

      {/* Color Palettes - Modern Design */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 admin-dark:text-white">Paletas de Colores</h2>
            <p className="text-sm text-gray-600 admin-dark:text-gray-300">Elige el estilo visual de tu catálogo</p>
          </div>
        </div>

        {/* Modern Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {COLOR_PALETTES.map((palette) => (
            <div
              key={palette.id}
              onClick={() => handlePaletteChange(palette.id)}
              className={`group relative bg-white admin-dark:bg-gray-700 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 ${
                selectedPalette === palette.id
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                  : 'border-gray-100 admin-dark:border-gray-600 hover:border-gray-200 admin-dark:hover:border-gray-500'
              }`}
            >
              {/* Selection Indicator */}
              {selectedPalette === palette.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Color Dots */}
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: palette.primary }}
                ></div>
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: palette.secondary }}
                ></div>
                <div className="flex-1">
                  <div className="w-full h-1 bg-gradient-to-r rounded-full"
                       style={{ 
                         background: `linear-gradient(90deg, ${palette.primary} 0%, ${palette.secondary} 100%)`
                       }}
                  ></div>
                </div>
              </div>

              {/* Palette Info */}
              <div>
                <h3 className="font-semibold text-gray-900 admin-dark:text-white mb-2 group-hover:text-indigo-600 admin-dark:group-hover:text-indigo-400 transition-colors">
                  {palette.name}
                </h3>
                <p className="text-sm text-gray-600 admin-dark:text-gray-300 leading-relaxed">
                  {palette.description}
                </p>
              </div>

              {/* Selected Badge */}
              {selectedPalette === palette.id && (
                <div className="mt-4 flex items-center gap-2 text-indigo-600 admin-dark:text-indigo-400">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Seleccionado</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Current Palette Preview */}
        <div className="mt-8 p-6 bg-gray-50 admin-dark:bg-gray-700 rounded-2xl">
          <h3 className="font-semibold text-gray-900 admin-dark:text-white mb-4">Vista Previa del Tema Actual</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl shadow-md border-2 border-white"
                style={{ backgroundColor: currentPaletteData.primary }}
              ></div>
              <div>
                <p className="text-sm font-medium text-gray-900 admin-dark:text-white">Primario</p>
                <p className="text-xs text-gray-600 admin-dark:text-gray-300 font-mono">{currentPaletteData.primary}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl shadow-md border-2 border-white"
                style={{ backgroundColor: currentPaletteData.secondary }}
              ></div>
              <div>
                <p className="text-sm font-medium text-gray-900 admin-dark:text-white">Secundario</p>
                <p className="text-xs text-gray-600 admin-dark:text-gray-300 font-mono">{currentPaletteData.secondary}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Border Radius Configuration */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded" style={{ borderRadius: `${selectedRadius/4}px` }}></div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 admin-dark:text-white">Radio del Borde</h2>
            <p className="text-sm text-gray-600 admin-dark:text-gray-300">Ajusta el redondeado de los elementos</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Slider Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 admin-dark:text-gray-300">Redondeado</span>
              <span className="text-lg font-bold text-gray-900 admin-dark:text-white bg-gray-100 admin-dark:bg-gray-700 px-3 py-1 rounded-lg">
                {selectedRadius}px
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="20"
              value={selectedRadius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 admin-dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            
            <div className="flex justify-between text-xs text-gray-500 admin-dark:text-gray-400">
              <span>0px (Cuadrado)</span>
              <span>10px (Moderado)</span>
              <span>20px (Muy redondeado)</span>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-gray-50 admin-dark:bg-gray-700 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 admin-dark:text-white text-sm mb-4">Vista Previa</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Product Card Preview */}
              <div>
                <div 
                  className="bg-white admin-dark:bg-gray-600 border border-gray-200 admin-dark:border-gray-500 overflow-hidden shadow-sm"
                  style={{ borderRadius: `${selectedRadius}px` }}
                >
                  <div className="aspect-square bg-gray-100 admin-dark:bg-gray-500 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Imagen</span>
                  </div>
                  <div className="p-3">
                    <h5 className="font-medium text-gray-900 admin-dark:text-white text-xs truncate">Producto</h5>
                    <p className="text-xs text-gray-600 admin-dark:text-gray-300">$29.99</p>
                    <button 
                      className="mt-2 text-white text-xs px-3 py-1.5 font-medium w-full"
                      style={{ 
                        backgroundColor: currentPaletteData.primary,
                        borderRadius: `${Math.max(selectedRadius - 2, 0)}px`
                      }}
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* Button Preview */}
              <div className="flex items-center">
                <button 
                  className="w-full text-white py-3 px-4 text-sm font-medium"
                  style={{ 
                    backgroundColor: currentPaletteData.primary,
                    borderRadius: `${selectedRadius}px`
                  }}
                >
                  Botón
                </button>
              </div>

              {/* Input Preview */}
              <div className="flex items-center">
                <input 
                  type="text" 
                  placeholder="Campo de texto"
                  className="w-full border border-gray-300 admin-dark:border-gray-600 px-3 py-3 text-xs admin-dark:bg-gray-600 admin-dark:text-white"
                  style={{ borderRadius: `${selectedRadius}px` }}
                />
              </div>

              {/* Style Label */}
              <div className="flex items-center">
                <div className="w-full bg-gray-100 admin-dark:bg-gray-600 p-3 text-xs text-gray-600 admin-dark:text-gray-300 text-center font-medium"
                     style={{ borderRadius: `${selectedRadius}px` }}>
                  {selectedRadius === 0 && "Cuadrado"}
                  {selectedRadius > 0 && selectedRadius <= 5 && "Profesional"}
                  {selectedRadius > 5 && selectedRadius <= 12 && "Moderno"}
                  {selectedRadius > 12 && "Suave"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Per Page */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 admin-dark:text-white">Productos por Página</h2>
            <p className="text-sm text-gray-600 admin-dark:text-gray-300">Controla cuántos productos se muestran</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <select
            value={productsPerPage}
            onChange={(e) => handleProductsPerPageChange(parseInt(e.target.value))}
            className="px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent admin-dark:bg-gray-700 admin-dark:text-white"
          >
            {PRODUCTS_PER_PAGE_OPTIONS.map(count => (
              <option key={count} value={count}>
                {count} Productos
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600 admin-dark:text-gray-300">
            Los clientes verán {productsPerPage} productos por página en tu catálogo
          </span>
        </div>
      </div>

      {/* Preview Link */}
      {store && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 admin-dark:from-gray-800 admin-dark:to-gray-900 rounded-2xl border border-indigo-200 admin-dark:border-indigo-800 p-6 lg:p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 admin-dark:text-white mb-3">¿Quieres ver cómo se ve?</h3>
            <p className="text-gray-700 admin-dark:text-gray-300 mb-6">
              Revisa tu catálogo con los cambios aplicados
            </p>
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-105"
            >
              <Monitor className="w-5 h-5" />
              Ver Catálogo
            </a>
          </div>
        </div>
      )}

      {/* Save Button - Mobile Fixed */}
      {hasUnsavedChanges && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
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

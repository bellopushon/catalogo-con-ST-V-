import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Copy, Eye, EyeOff, Package, Filter, ChevronRight, Download } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/constants';
import ProductForm from './ProductForm';
import ExportModal from './ExportModal';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const { state, updateProduct, deleteProduct, getMaxProducts, createProduct, getUserPlan } = useStore();
  const { success, error } = useToast();

  const store = state.currentStore;
  const products = store?.products || [];
  const categories = store?.categories || [];

  // Obtener plan del usuario
  const userPlan = getUserPlan(state.user);
  const planName = userPlan?.name || 'Gratuito';

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    setIsDeleting(productId);

    try {
      await deleteProduct(productId);
      success('¡Producto eliminado!', 'El producto se ha eliminado correctamente');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      error('Error al eliminar', err.message || 'No se pudo eliminar el producto. Intenta de nuevo.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (product: any) => {
    try {
      await updateProduct({
        ...product,
        isActive: !product.isActive
      });
      success(
        product.isActive ? 'Producto desactivado' : 'Producto activado',
        `El producto ahora está ${product.isActive ? 'inactivo' : 'activo'}`
      );
    } catch (err: any) {
      console.error('Error toggling product status:', err);
      error('Error al cambiar estado', err.message || 'No se pudo cambiar el estado del producto.');
    }
  };

  const handleDuplicateProduct = async (product: any) => {
    try {
      setIsDuplicating(product.id);
      
      // Create a duplicate product with "(Copia)" appended to the name
      // Set isActive to false by default to prevent it from appearing in the live catalog
      const duplicatedProduct = {
        name: `${product.name} (Copia)`,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        price: product.price,
        categoryId: product.categoryId,
        mainImage: product.mainImage,
        gallery: product.gallery,
        isActive: false, // Set to inactive by default for review
        isFeatured: false, // Reset featured status for duplicates
      };

      // Create the new product
      await createProduct(duplicatedProduct);
      
      success(
        '¡Producto duplicado!', 
        `Se ha creado una copia de "${product.name}" en estado inactivo. Edítalo antes de activarlo.`
      );
    } catch (err: any) {
      console.error('Error duplicating product:', err);
      error('Error al duplicar', err.message || 'No se pudo duplicar el producto. Intenta de nuevo.');
    } finally {
      setIsDuplicating(null);
    }
  };

  const maxProducts = getMaxProducts();
  const canCreateProduct = products.length < maxProducts;

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onClose={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - Simplified */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 admin-dark:text-white">Productos</h1>
          <p className="text-sm text-gray-600 admin-dark:text-gray-300">Gestiona tu catálogo</p>
        </div>
        <div className="flex items-center gap-2">
          {products.length > 0 && (
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-white admin-dark:bg-gray-700 hover:bg-gray-100 admin-dark:hover:bg-gray-600 text-gray-700 admin-dark:text-gray-300 p-2 rounded-full shadow-md transition-colors"
              aria-label="Exportar productos"
              title="Exportar productos"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
          {canCreateProduct && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md transition-colors"
              aria-label="Añadir producto"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Plan Limits - Compact */}
      <div className="bg-blue-50 admin-dark:bg-blue-900/20 border border-blue-200 admin-dark:border-blue-700 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-800 admin-dark:text-blue-300">
            Puedes crear hasta {maxProducts === 999999 ? '∞' : maxProducts} productos en tu plan {planName}
          </p>
          <div className="font-bold text-blue-900 admin-dark:text-blue-200">
            {products.length} / {maxProducts === 999999 ? '∞' : maxProducts}
          </div>
        </div>
      </div>

      {/* Search and Filters - Compact */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 admin-dark:border-gray-600 rounded-lg text-sm admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 border border-gray-300 admin-dark:border-gray-600 rounded-lg text-gray-600 admin-dark:text-gray-300 hover:bg-gray-100 admin-dark:hover:bg-gray-700"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Category Filter - Collapsible */}
      {showFilters && (
        <div className="bg-white admin-dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 admin-dark:border-gray-700 p-3 animate-fade-in">
          <label className="block text-sm font-medium text-gray-700 admin-dark:text-gray-300 mb-2">
            Filtrar por categoría
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 admin-dark:border-gray-600 rounded-lg text-sm admin-dark:bg-gray-700 admin-dark:text-white"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Products List - Minimalist */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white admin-dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 admin-dark:border-gray-700 p-6 text-center">
          <div className="w-12 h-12 bg-gray-100 admin-dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 admin-dark:text-white mb-1">No hay productos</h3>
          <p className="text-sm text-gray-600 admin-dark:text-gray-300 mb-4">
            {searchTerm || selectedCategory 
              ? 'No se encontraron productos con los filtros aplicados'
              : 'Comienza añadiendo tu primer producto'
            }
          </p>
          {canCreateProduct && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Añadir Producto
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => {
            const category = categories.find(c => c.id === product.categoryId);
            
            return (
              <div key={product.id} className="bg-white admin-dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 admin-dark:border-gray-700 overflow-hidden">
                <div className="flex items-center">
                  {/* Product Image - Thumbnail */}
                  <div className="w-16 h-16 bg-gray-100 admin-dark:bg-gray-700 flex-shrink-0 relative">
                    {product.mainImage ? (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    {!product.isActive && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                          Oculto
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info - Compact */}
                  <div className="flex-1 min-w-0 px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 admin-dark:text-white text-sm truncate pr-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!product.isActive && (
                          <span className="bg-red-100 admin-dark:bg-red-900/30 text-red-800 admin-dark:text-red-300 text-xs px-1.5 py-0.5 rounded">
                            Inactivo
                          </span>
                        )}
                        {product.isFeatured && (
                          <span className="bg-yellow-100 admin-dark:bg-yellow-900/30 text-yellow-800 admin-dark:text-yellow-300 text-xs px-1.5 py-0.5 rounded">
                            ⭐
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 admin-dark:text-white">
                          {formatCurrency(product.price, store?.currency || 'USD')}
                        </p>
                        {category && (
                          <p className="text-xs text-gray-500 admin-dark:text-gray-400">{category.name}</p>
                        )}
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowForm(true);
                          }}
                          className="p-1.5 text-gray-500 admin-dark:text-gray-400 hover:text-indigo-600 admin-dark:hover:text-indigo-400"
                          aria-label="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`p-1.5 ${
                            product.isActive
                              ? 'text-gray-500 admin-dark:text-gray-400 hover:text-red-600 admin-dark:hover:text-red-400'
                              : 'text-gray-500 admin-dark:text-gray-400 hover:text-green-600 admin-dark:hover:text-green-400'
                          }`}
                          aria-label={product.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => handleDuplicateProduct(product)}
                          disabled={isDuplicating === product.id || !canCreateProduct}
                          className="p-1.5 text-gray-500 admin-dark:text-gray-400 hover:text-blue-600 admin-dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Duplicar"
                          title={!canCreateProduct ? "Has alcanzado el límite de productos" : "Duplicar producto"}
                        >
                          {isDuplicating === product.id ? (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={isDeleting === product.id}
                          className="p-1.5 text-gray-500 admin-dark:text-gray-400 hover:text-red-600 admin-dark:hover:text-red-400 disabled:opacity-50"
                          aria-label="Eliminar"
                        >
                          {isDeleting === product.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowForm(true);
                          }}
                          className="p-1.5 text-gray-400 admin-dark:text-gray-500"
                          aria-label="Ver detalles"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}

      {/* Add Product - Fixed Button for Mobile */}
      {canCreateProduct && (
        <div className="fixed bottom-20 right-4 z-10 lg:hidden">
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
            aria-label="Añadir producto"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
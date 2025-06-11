import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Copy, Eye, EyeOff, Package, Filter, ChevronRight, Download } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import type { Product, Category } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/constants';
import ProductForm from './ProductForm';
import ExportModal from './ExportModal';

const ProductList = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const { state, updateProduct, createProduct, deleteProduct, getUserPlan, getMaxProducts } = useStore();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const store = state.currentStore;
  const categories = store?.categories.filter(c => c.id !== 'default') || [];
  const userPlan = getUserPlan(state.user);
  const maxProducts = getMaxProducts();
  const currentActiveProducts = store?.products.filter((p: Product) => p.isActive).length || 0;

  const filteredProducts = useMemo(() => {
    return store?.products.filter((product: Product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.longDescription?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    }) || [];
  }, [store?.products, searchTerm, selectedCategory]);

  const handleToggleActive = async (product: Product) => {
    try {
      if (!product.isActive && currentActiveProducts >= maxProducts) {
        error(
          'Límite alcanzado',
          `Has alcanzado el límite de ${maxProducts} productos activos en tu plan ${userPlan?.name || 'Gratuito'}. Actualiza tu plan para activar más productos.`
        );
        return;
      }

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

  const handleDuplicateProduct = async (product: Product) => {
    try {
      if (currentActiveProducts >= maxProducts) {
        error(
          'Límite alcanzado',
          `Has alcanzado el límite de ${maxProducts} productos activos en tu plan ${userPlan?.name || 'Gratuito'}. Actualiza tu plan para crear más productos.`
        );
        return;
      }

      setIsDuplicating(product.id);

      const newProduct = {
        ...product,
        id: undefined,
        name: `${product.name} (copia)`,
        isActive: false,
        createdAt: undefined,
        updatedAt: undefined
      };

      await createProduct(newProduct);
      success('¡Producto duplicado!', 'El producto se ha duplicado correctamente');
    } catch (err: any) {
      console.error('Error duplicating product:', err);
      error('Error al duplicar', err.message || 'No se pudo duplicar el producto. Intenta de nuevo.');
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setIsDeleting(productId);
      await deleteProduct(productId);
      success('Producto eliminado', 'El producto se ha eliminado correctamente');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      error('Error al eliminar', err.message || 'No se pudo eliminar el producto. Intenta de nuevo.');
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const canCreateProduct = (store?.products?.length || 0) < maxProducts;

  if (showForm) {
    return (
      <ProductForm
        onClose={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 admin-dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 admin-dark:text-white">Productos</h1>
          <div className="flex items-center gap-1 md:gap-2">
            {(store?.products?.length || 0) > 0 && (
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-gray-700 admin-dark:text-gray-200 bg-white admin-dark:bg-gray-800 border border-gray-300 admin-dark:border-gray-700 rounded-lg hover:bg-gray-50 admin-dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo producto</span>
            </button>
          </div>
        </div>

        {/* Plan Limits - Compact */}
        <div className="bg-blue-50 admin-dark:bg-blue-900/20 border border-blue-200 admin-dark:border-blue-700 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800 admin-dark:text-blue-300">
              Puedes crear hasta {maxProducts === 999999 ? '∞' : maxProducts} productos en tu plan {userPlan?.name || 'Gratuito'}
            </p>
            <div className="font-bold text-blue-900 admin-dark:text-blue-200">
              {store?.products.length} / {maxProducts === 999999 ? '∞' : maxProducts}
            </div>
          </div>
        </div>

        {/* Límite alcanzado - Banner de advertencia */}
        {store && store.products.length >= maxProducts && maxProducts !== 999999 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 admin-dark:from-yellow-900 admin-dark:to-orange-900 border border-yellow-200 admin-dark:border-yellow-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm mb-2 mt-2">
            <div className="w-8 h-8 bg-yellow-100 admin-dark:bg-yellow-800 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-yellow-600 admin-dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 admin-dark:text-white text-sm mb-0.5">
                Límite de productos alcanzado
              </h3>
              <p className="text-xs text-gray-900 admin-dark:text-gray-100">
                Actualiza tu plan para añadir más productos.
              </p>
            </div>
            <a
              href="/subscription"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm"
            >
              Ver Planes
            </a>
          </div>
        )}

        {/* Search and Filters - Compact */}
        <div className="flex items-center gap-2 mb-4">
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
              {categories.map((category: Category) => (
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
            {filteredProducts.map((product: Product) => {
              const category = categories.find((c: Category) => c.id === product.categoryId);
              
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
                          {category ? (
                            <p className="text-xs text-gray-500 admin-dark:text-gray-400">{category.name}</p>
                          ) : (
                            <p className="text-xs text-gray-500 admin-dark:text-gray-400">Sin categoría</p>
                          )}
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(product)}
                            className={`p-1.5 rounded-full transition-colors ${
                              product.isActive
                                ? 'text-gray-500 admin-dark:text-gray-400 hover:text-red-600 admin-dark:hover:text-red-400'
                                : 'text-gray-500 admin-dark:text-gray-400 hover:text-green-600 admin-dark:hover:text-green-400'
                            }`}
                            title={product.isActive ? 'Desactivar' : 'Activar'}
                            disabled={!product.isActive && currentActiveProducts >= maxProducts}
                          >
                            {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setShowForm(true);
                            }}
                            className="p-1.5 text-gray-500 admin-dark:text-gray-400 hover:text-indigo-600 admin-dark:hover:text-indigo-400"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDuplicateProduct(product)}
                            disabled={isDuplicating === product.id}
                            className="p-1.5 text-gray-500 admin-dark:text-gray-400 hover:text-indigo-600 admin-dark:hover:text-indigo-400"
                            title="Duplicar"
                          >
                            {isDuplicating === product.id ? (
                              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={isDeleting === product.id}
                            className="p-1.5 text-gray-500 admin-dark:text-gray-400 hover:text-red-600 admin-dark:hover:text-red-400"
                            title="Eliminar"
                          >
                            {isDeleting === product.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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
    </div>
  );
};

export default ProductList;
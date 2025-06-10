import React, { useState } from 'react';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';

export default function CategoryManager() {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const { state, createCategory, updateCategory, deleteCategory, getMaxCategories, getUserPlan } = useStore();
  const { success, error } = useToast();

  const store = state.currentStore;
  const categories = store?.categories || [];
  const products = store?.products || [];

  // Obtener plan del usuario
  const userPlan = getUserPlan(state.user);
  const planName = userPlan?.name || 'Gratuito';

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !store) return;

    setIsCreating(true);

    try {
      await createCategory({
        name: newCategoryName.trim(),
      });

      setNewCategoryName('');
      success('¡Categoría creada!', 'La nueva categoría se ha añadido correctamente');
    } catch (err: any) {
      console.error('Error creating category:', err);
      error('Error al crear categoría', err.message || 'No se pudo crear la categoría. Intenta de nuevo.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !store || !editingCategory) return;

    setIsUpdating(true);

    try {
      const categoryToUpdate = categories.find(c => c.id === editingCategory);
      if (!categoryToUpdate) return;

      await updateCategory({
        ...categoryToUpdate,
        name: editName.trim(),
      });

      setEditingCategory(null);
      setEditName('');
      success('¡Categoría actualizada!', 'Los cambios se han guardado correctamente');
    } catch (err: any) {
      console.error('Error updating category:', err);
      error('Error al actualizar', err.message || 'No se pudo actualizar la categoría. Intenta de nuevo.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!store) return;
    
    const productsInCategory = products.filter(p => p.categoryId === categoryId);
    
    if (productsInCategory.length > 0) {
      if (!window.confirm(`Esta categoría tiene ${productsInCategory.length} producto(s). Si la eliminas, estos productos se quedarán sin categoría. ¿Continuar?`)) {
        return;
      }
    }

    setIsDeleting(categoryId);

    try {
      await deleteCategory(categoryId);
      success('¡Categoría eliminada!', 'La categoría se ha eliminado correctamente');
    } catch (err: any) {
      console.error('Error deleting category:', err);
      error('Error al eliminar', err.message || 'No se pudo eliminar la categoría. Intenta de nuevo.');
    } finally {
      setIsDeleting(null);
    }
  };

  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  const maxCategories = getMaxCategories();
  const canCreateCategory = categories.length < maxCategories;

  // Show message if no store is available
  if (!store) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Gestión de Categorías</h1>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">Organiza tus productos en categorías</p>
        </div>
        <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-8 lg:p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 admin-dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 admin-dark:text-white mb-2">No hay tienda configurada</h3>
          <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base">Primero debes configurar tu tienda para gestionar categorías</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 admin-dark:text-white">Gestión de Categorías</h1>
        <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base mt-1">Organiza tus productos en categorías</p>
      </div>

      {/* Plan Limits Info */}
      <div className="bg-blue-50 admin-dark:bg-blue-900/20 border border-blue-200 admin-dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900 admin-dark:text-blue-200">Límite de Categorías</h3>
            <p className="text-sm text-blue-800 admin-dark:text-blue-300">
              {maxCategories === 999999 
                ? `Categorías ilimitadas en tu plan ${planName}`
                : `Puedes crear hasta ${maxCategories} categorías en tu plan ${planName}`
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900 admin-dark:text-blue-200">
              {categories.length} / {maxCategories === 999999 ? '∞' : maxCategories}
            </div>
          </div>
        </div>
      </div>

      {/* Add New Category - Mobile Optimized */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700 p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white mb-4">Añadir Nueva Categoría</h2>
        
        {canCreateCategory ? (
          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre de la categoría"
                className="w-full px-4 py-3 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                maxLength={50}
                required
                disabled={isCreating}
              />
            </div>
            <button
              type="submit"
              disabled={!newCategoryName.trim() || isCreating}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Creando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Añadir</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="bg-yellow-50 admin-dark:bg-yellow-900/20 border border-yellow-200 admin-dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 admin-dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-yellow-600 admin-dark:text-yellow-400" />
              </div>
              <div>
                <h4 className="font-medium text-yellow-800 admin-dark:text-yellow-200">
                  Límite alcanzado
                </h4>
                <p className="text-sm text-yellow-700 admin-dark:text-yellow-300">
                  Has alcanzado el límite de {maxCategories} categorías para tu plan {planName}.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories List - Mobile Optimized */}
      <div className="bg-white admin-dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 admin-dark:border-gray-700">
        <div className="p-4 lg:p-6 border-b border-gray-200 admin-dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 admin-dark:text-white">Categorías Existentes</h2>
        </div>

        {categories.length === 0 ? (
          <div className="p-8 lg:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 admin-dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 admin-dark:text-white mb-2">No hay categorías</h3>
            <p className="text-gray-600 admin-dark:text-gray-300 text-sm lg:text-base">Crea tu primera categoría para organizar tus productos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 admin-dark:divide-gray-700">
            {categories.map(category => (
              <div key={category.id} className="p-4 lg:p-6 flex items-center justify-between">
                <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-indigo-100 admin-dark:bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-indigo-600 admin-dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingCategory === category.id ? (
                      <form onSubmit={handleUpdateCategory} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 admin-dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm lg:text-base admin-dark:bg-gray-700 admin-dark:text-white admin-dark:placeholder-gray-400"
                          maxLength={50}
                          autoFocus
                          required
                          disabled={isUpdating}
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            {isUpdating ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              'Guardar'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(null);
                              setEditName('');
                            }}
                            disabled={isUpdating}
                            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-900 admin-dark:text-white text-sm lg:text-base truncate">{category.name}</h3>
                        <p className="text-xs lg:text-sm text-gray-500 admin-dark:text-gray-400">
                          {getProductCount(category.id)} producto(s)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {editingCategory !== category.id && (
                  <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEditCategory(category)}
                      disabled={isDeleting === category.id}
                      className="p-2 text-gray-600 admin-dark:text-gray-400 hover:text-indigo-600 admin-dark:hover:text-indigo-400 hover:bg-indigo-50 admin-dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={isDeleting === category.id}
                      className="p-2 text-gray-600 admin-dark:text-gray-400 hover:text-red-600 admin-dark:hover:text-red-400 hover:bg-red-50 admin-dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {isDeleting === category.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
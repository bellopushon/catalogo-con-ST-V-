import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Share2, Phone, Facebook, Instagram, Twitter, MessageCircle, Search, Filter } from 'lucide-react';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useTheme, COLOR_PALETTES } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/constants';
import { supabase } from '../../lib/supabase';
import ProductModal from './ProductModal';
import CartModal from './CartModal';
import { Store, Category, Product } from '../../types';
import { applyTheme } from '../../utils/theme';
import { LoadingScreen } from '../common/LoadingScreen';
import { ErrorScreen } from '../common/ErrorScreen';

// 🔥 CRITICAL: Independent store loading for public catalog
async function loadPublicStore(slug: string) {
  try {
    console.log('🔍 Loading public store:', slug);
    
    // Load store by slug
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active') // Solo tiendas activas
      .single();

    if (storeError || !storeData) {
      console.error('❌ Store not found or not active:', storeError);
      return null;
    }

    // Load categories for this store
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeData.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    // Load active products for this store
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeData.id)
      .eq('is_active', true) // Only load active products for public catalog
      .order('created_at', { ascending: true });

    // Transform data
    const categories = (categoriesData || []).map(cat => ({
      id: cat.id,
      storeId: cat.store_id,
      name: cat.name,
      createdAt: cat.created_at,
    }));

    const products = (productsData || []).map(prod => ({
      id: prod.id,
      storeId: prod.store_id,
      categoryId: prod.category_id || undefined,
      name: prod.name,
      shortDescription: prod.short_description || undefined,
      longDescription: prod.long_description || undefined,
      price: parseFloat(prod.price),
      mainImage: prod.main_image || undefined,
      gallery: prod.gallery || [],
      isActive: prod.is_active ?? true,
      isFeatured: prod.is_featured ?? false,
      createdAt: prod.created_at,
      updatedAt: prod.updated_at,
    }));

    const store = {
      id: storeData.id,
      userId: storeData.user_id,
      name: storeData.name,
      slug: storeData.slug,
      description: storeData.description || undefined,
      logo: storeData.logo || undefined,
      whatsapp: storeData.whatsapp || undefined,
      currency: storeData.currency || 'USD',
      headingFont: storeData.heading_font || 'Inter',
      bodyFont: storeData.body_font || 'Inter',
      colorPalette: storeData.color_palette || 'predeterminado',
      borderRadius: storeData.border_radius || 8,
      productsPerPage: storeData.products_per_page || 12,
      facebookUrl: storeData.facebook_url || undefined,
      instagramUrl: storeData.instagram_url || undefined,
      tiktokUrl: storeData.tiktok_url || undefined,
      twitterUrl: storeData.twitter_url || undefined,
      showSocialInCatalog: storeData.show_social_in_catalog ?? true,
      acceptCash: storeData.accept_cash ?? true,
      acceptBankTransfer: storeData.accept_bank_transfer ?? false,
      bankDetails: storeData.bank_details || undefined,
      allowPickup: storeData.allow_pickup ?? true,
      allowDelivery: storeData.allow_delivery ?? false,
      deliveryCost: storeData.delivery_cost || 0,
      deliveryZone: storeData.delivery_zone || undefined,
      messageGreeting: storeData.message_greeting || '¡Hola {storeName}!',
      messageIntroduction: storeData.message_introduction || 'Soy {customerName}.\nMe gustaría hacer el siguiente pedido:',
      messageClosing: storeData.message_closing || '¡Muchas gracias!',
      includePhoneInMessage: storeData.include_phone_in_message ?? true,
      includeCommentsInMessage: storeData.include_comments_in_message ?? true,
      createdAt: storeData.created_at,
      updatedAt: storeData.updated_at,
      categories,
      products,
      paymentMethods: {
        cash: storeData.accept_cash ?? true,
        bankTransfer: storeData.accept_bank_transfer ?? false,
      },
      shippingMethods: {
        pickup: storeData.allow_pickup ?? true,
        delivery: storeData.allow_delivery ?? false,
        deliveryCost: storeData.delivery_cost || 0,
        deliveryZone: storeData.delivery_zone || undefined,
      },
    };

    console.log('✅ Store loaded successfully:', store.name);
    return store;
  } catch (error) {
    console.error('❌ Error loading public store:', error);
    return null;
  }
}

export function PublicCatalog() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { trackVisit } = useAnalytics();
  const { applyTheme } = useTheme();
  
  // 🔥 CRITICAL: Independent state for public catalog
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hasTrackedVisit, setHasTrackedVisit] = useState(false);

  const DEFAULT_CATEGORY_ID = 'default';

  // 🔥 CRITICAL: Load store independently from authentication context
  useEffect(() => {
    if (!slug) return;

    const loadStore = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const storeData = await loadPublicStore(slug);
        
        if (!storeData) {
          setError('Esta tienda está suspendida o no está disponible.');
          return;
        }
        
        setStore(storeData);
        
        // Track visit only once per component mount
        if (!hasTrackedVisit) {
          trackVisit(storeData.id);
          setHasTrackedVisit(true);
        }

        // Apply store theme to the public catalog
        const paletteId = storeData.colorPalette || 'predeterminado';
        const borderRadius = storeData.borderRadius || 8;
        
        // Find the palette data
        const palette = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];
        
        console.log('🎨 Applying catalog theme:', { paletteId, palette, borderRadius });
        
        // Apply CSS variables for the theme - CRITICAL FIX
        const root = document.documentElement;
        root.style.setProperty('--catalog-primary', palette.primary);
        root.style.setProperty('--catalog-secondary', palette.secondary);
        root.style.setProperty('--catalog-border-radius', `${borderRadius}px`);
        
        // Also apply the standard variables for compatibility
        root.style.setProperty('--color-primary', palette.primary);
        root.style.setProperty('--color-secondary', palette.secondary);
        root.style.setProperty('--border-radius', `${borderRadius}px`);
        
        // Apply theme using the theme context
        applyTheme(paletteId, borderRadius);
        
        // Set page title
        document.title = `${storeData.name} - Catálogo`;
        
        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (categoriesError) {
          console.error('Error loading categories:', categoriesError);
        } else {
          setCategories(categoriesData || []);
        }

        // Load products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (productsError) {
          console.error('Error loading products:', productsError);
        } else {
          setProducts(productsData || []);
        }

      } catch (err: any) {
        console.error('Error loading store:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStore();

    // Cleanup function to reset theme when component unmounts
    return () => {
      // Reset to default theme
      const root = document.documentElement;
      root.style.setProperty('--catalog-primary', '#6366f1');
      root.style.setProperty('--catalog-secondary', '#ec4899');
      root.style.setProperty('--catalog-border-radius', '8px');
      root.style.setProperty('--color-primary', '#6366f1');
      root.style.setProperty('--color-secondary', '#ec4899');
      root.style.setProperty('--border-radius', '8px');
    };
  }, [slug, applyTheme, trackVisit, hasTrackedVisit]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={() => navigate('/')} />;
  }

  if (!store) {
    return <ErrorScreen message="Tienda no encontrada" onRetry={() => navigate('/')} />;
  }

  const activeProducts = store.products || [];
  const categoriesData = store.categories.filter((c: any) => c.id !== DEFAULT_CATEGORY_ID);

  const filteredProducts = activeProducts.filter((product: any) => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedCategory && product.categoryId === DEFAULT_CATEGORY_ID) return false;
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: any) => {
    setCart((prev: any[]) => {
      const existing = prev.find((item: any) => item.product.id === product.id);
      if (existing) {
        return prev.map((item: any) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const shareStore = async () => {
    const shareData = {
      title: store.name,
      text: store.description || `Catálogo de ${store.name}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to clipboard
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Enlace copiado al portapapeles');
    }).catch(() => {
      // Final fallback
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Enlace copiado al portapapeles');
    });
  };

  const cartItemsCount = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);

  // Get current theme colors for dynamic styling
  const currentPalette = COLOR_PALETTES.find(p => p.id === (store.colorPalette || 'predeterminado')) || COLOR_PALETTES[0];

  // Filtrar categorías válidas para mostrar en el catálogo público
  const validCategories = (categories || []).filter((cat, idx) => idx < categories.length && cat.is_active && products.some(p => p.category_id === cat.id && p.is_active));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {store?.logo && (
                <img
                  src={store?.logo}
                  alt={store?.name}
                  className="w-12 h-12 object-contain rounded-lg"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{store?.name}</h1>
                {store?.description && (
                  <p className="text-sm text-gray-600">{store?.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={shareStore}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {cartItemsCount > 0 && (
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-2 text-white rounded-lg transition-colors"
                  style={{ backgroundColor: currentPalette.primary }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                autoFocus
              />
            </div>
          )}
        </div>
      </header>

      {/* Category Navigation */}
      {validCategories.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !selectedCategory
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={!selectedCategory ? { backgroundColor: currentPalette.primary } : {}}
              >
                Todos ({products.length})
              </button>
              {validCategories.map((category) => {
                const categoryProductCount = products.filter((p) => p.category_id === category.id && p.is_active).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={selectedCategory === category.id ? { backgroundColor: currentPalette.primary } : {}}
                  >
                    {category.name} ({categoryProductCount})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No hay productos que coincidan con "${searchTerm}"`
                : selectedCategory 
                ? 'No hay productos en esta categoría' 
                : 'Esta tienda aún no tiene productos'
              }
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                className="mt-4 font-medium transition-colors"
                style={{ color: currentPalette.primary }}
              >
                Ver todos los productos
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} 
                {searchTerm && ` para "${searchTerm}"`}
                {selectedCategory && ` en ${(categoriesData.find((c: any) => c.id === selectedCategory)?.name)}`}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div
                    className="aspect-square bg-gray-100 cursor-pointer relative"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.mainImage ? (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {product.isFeatured && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          ⭐
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <h3
                      className="font-medium text-gray-900 text-sm leading-tight mb-2 cursor-pointer transition-colors line-clamp-2 hover:text-[var(--catalog-primary)]"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.name}
                    </h3>
                    
                    {product.shortDescription && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {product.shortDescription}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(product.price, store?.currency || 'USD')}
                      </p>
                      <button
                        onClick={() => addToCart(product)}
                        className="text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                        style={{ 
                          backgroundColor: currentPalette.primary,
                          borderRadius: `${store?.borderRadius || 8}px`
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Social Media */}
          {store?.showSocialInCatalog && (
            <div className="flex justify-center gap-4 mb-4">
              {store?.facebookUrl && (
                <a
                  href={store?.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {store?.instagramUrl && (
                <a
                  href={store?.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-pink-600 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {store?.twitterUrl && (
                <a
                  href={store?.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-blue-400 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
            </div>
          )}

          {/* WhatsApp Contact */}
          {store?.whatsapp && (
            <div className="text-center mb-4">
              <a
                href={`https://wa.me/${store?.whatsapp.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar por WhatsApp
              </a>
            </div>
          )}

          {/* Powered by */}
          <div className="text-center text-xs text-gray-500">
            Powered by <span className="font-medium">Tutaviendo</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          store={store}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {showCart && (
        <CartModal
          cart={cart}
          store={store}
          onClose={() => setShowCart(false)}
          onUpdateCart={setCart}
        />
      )}
    </div>
  );
}
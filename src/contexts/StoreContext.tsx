import React, { createContext, useContext, useReducer, useEffect, Dispatch, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Definición de tipos
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  company?: string;
  location?: string;
  plan: 'gratuito' | 'emprendedor' | 'profesional';
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'expired';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionCanceledAt?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId?: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  mainImage?: string;
  gallery: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  whatsapp?: string;
  currency: string;
  headingFont: string;
  bodyFont: string;
  colorPalette: string;
  borderRadius: number;
  productsPerPage: number;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  showSocialInCatalog: boolean;
  acceptCash: boolean;
  acceptBankTransfer: boolean;
  bankDetails?: string;
  allowPickup: boolean;
  allowDelivery: boolean;
  deliveryCost: number;
  deliveryZone?: string;
  messageGreeting: string;
  messageIntroduction: string;
  messageClosing: string;
  includePhoneInMessage: boolean;
  includeCommentsInMessage: boolean;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  categories: Category[];
  products: Product[];
}

export interface StoreState {
  user: User | null;
  stores: Store[];
  currentStore: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

// Definición del estado inicial
const initialState: StoreState = {
  user: null,
  stores: [],
  currentStore: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
};

// Tipos de acciones
type ActionType =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_STORES'; payload: Store[] }
  | { type: 'SET_CURRENT_STORE'; payload: Store | null }
  | { type: 'ADD_STORE'; payload: Store }
  | { type: 'UPDATE_STORE'; payload: Partial<Store> }
  | { type: 'DELETE_STORE'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'LOGOUT' };

// Reducer
function storeReducer(state: StoreState, action: ActionType): StoreState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_CURRENT_STORE':
      return { ...state, currentStore: action.payload };
    case 'ADD_STORE':
      const newStores = [...state.stores, action.payload];
      return { 
        ...state, 
        stores: newStores,
        currentStore: action.payload // Set as current store
      };
    case 'UPDATE_STORE':
      const updatedStores = state.stores.map(store =>
        store.id === state.currentStore?.id
          ? { ...store, ...action.payload, updatedAt: new Date().toISOString() }
          : store
      );
      const updatedCurrentStore = state.currentStore
        ? { ...state.currentStore, ...action.payload, updatedAt: new Date().toISOString() }
        : null;
      return {
        ...state,
        stores: updatedStores,
        currentStore: updatedCurrentStore
      };
    case 'DELETE_STORE':
      const filteredStores = state.stores.filter(store => store.id !== action.payload);
      const newCurrentStore = state.currentStore?.id === action.payload
        ? (filteredStores.length > 0 ? filteredStores[0] : null)
        : state.currentStore;
      return {
        ...state,
        stores: filteredStores,
        currentStore: newCurrentStore
      };
    case 'ADD_CATEGORY':
      if (!state.currentStore) return state;
      const storeWithNewCategory = {
        ...state.currentStore,
        categories: [...state.currentStore.categories, action.payload]
      };
      return {
        ...state,
        currentStore: storeWithNewCategory,
        stores: state.stores.map(store =>
          store.id === state.currentStore?.id ? storeWithNewCategory : store
        )
      };
    case 'UPDATE_CATEGORY':
      if (!state.currentStore) return state;
      const storeWithUpdatedCategory = {
        ...state.currentStore,
        categories: state.currentStore.categories.map(cat =>
          cat.id === action.payload.id ? action.payload : cat
        )
      };
      return {
        ...state,
        currentStore: storeWithUpdatedCategory,
        stores: state.stores.map(store =>
          store.id === state.currentStore?.id ? storeWithUpdatedCategory : store
        )
      };
    case 'DELETE_CATEGORY':
      if (!state.currentStore) return state;
      const storeWithoutCategory = {
        ...state.currentStore,
        categories: state.currentStore.categories.filter(cat => cat.id !== action.payload),
        products: state.currentStore.products.map(product =>
          product.categoryId === action.payload
            ? { ...product, categoryId: undefined }
            : product
        )
      };
      return {
        ...state,
        currentStore: storeWithoutCategory,
        stores: state.stores.map(store =>
          store.id === state.currentStore?.id ? storeWithoutCategory : store
        )
      };
    case 'ADD_PRODUCT':
      if (!state.currentStore) return state;
      const storeWithNewProduct = {
        ...state.currentStore,
        products: [...state.currentStore.products, action.payload]
      };
      return {
        ...state,
        currentStore: storeWithNewProduct,
        stores: state.stores.map(store =>
          store.id === state.currentStore?.id ? storeWithNewProduct : store
        )
      };
    case 'UPDATE_PRODUCT':
      if (!state.currentStore) return state;
      const storeWithUpdatedProduct = {
        ...state.currentStore,
        products: state.currentStore.products.map(product =>
          product.id === action.payload.id ? action.payload : product
        )
      };
      return {
        ...state,
        currentStore: storeWithUpdatedProduct,
        stores: state.stores.map(store =>
          store.id === state.currentStore?.id ? storeWithUpdatedProduct : store
        )
      };
    case 'DELETE_PRODUCT':
      if (!state.currentStore) return state;
      const storeWithoutProduct = {
        ...state.currentStore,
        products: state.currentStore.products.filter(product => product.id !== action.payload)
      };
      return {
        ...state,
        currentStore: storeWithoutProduct,
        stores: state.stores.map(store =>
          store.id === state.currentStore?.id ? storeWithoutProduct : store
        )
      };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'LOGOUT':
      return {
        ...initialState,
        isInitialized: true,
        isLoading: false
      };
    default:
      return state;
  }
}

// Contexto
const StoreContext = createContext<{
  state: StoreState;
  dispatch: Dispatch<ActionType>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  createStore: (storeData: Omit<Store, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'categories' | 'products'>) => Promise<Store>;
  updateStore: (storeData: Partial<Store>) => Promise<void>;
  createCategory: (categoryData: Omit<Category, 'id' | 'storeId' | 'createdAt'>) => Promise<Category>;
  updateCategory: (categoryData: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  createProduct: (productData: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (productData: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  canCreateStore: () => boolean;
  getMaxStores: () => number;
  getMaxProducts: () => number;
  getMaxCategories: () => number;
}>({
  state: initialState,
  dispatch: () => null,
  login: async () => {},
  register: async () => {},
  createStore: async () => ({} as Store),
  updateStore: async () => {},
  createCategory: async () => ({} as Category),
  updateCategory: async () => {},
  deleteCategory: async () => {},
  createProduct: async () => ({} as Product),
  updateProduct: async () => {},
  deleteProduct: async () => {},
  canCreateStore: () => false,
  getMaxStores: () => 1,
  getMaxProducts: () => 10,
  getMaxCategories: () => 3,
});

// Funciones auxiliares de transformación
function transformSupabaseUserToAppUser(supabaseUser: any, userData: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: userData?.name || '',
    phone: userData?.phone || undefined,
    bio: userData?.bio || undefined,
    avatar: userData?.avatar || undefined,
    company: userData?.company || undefined,
    location: userData?.location || undefined,
    plan: userData?.plan || 'gratuito',
    subscriptionId: userData?.subscription_id || undefined,
    subscriptionStatus: userData?.subscription_status || undefined,
    subscriptionStartDate: userData?.subscription_start_date || undefined,
    subscriptionEndDate: userData?.subscription_end_date || undefined,
    subscriptionCanceledAt: userData?.subscription_canceled_at || undefined,
    paymentMethod: userData?.payment_method || undefined,
    createdAt: userData?.created_at || undefined,
    updatedAt: userData?.updated_at || undefined,
  };
}

function transformSupabaseStoreToAppStore(storeData: any, categories: Category[] = [], products: Product[] = []): Store {
  return {
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
  };
}

function transformSupabaseCategoryToAppCategory(categoryData: any): Category {
  return {
    id: categoryData.id,
    storeId: categoryData.store_id,
    name: categoryData.name,
    createdAt: categoryData.created_at,
  };
}

function transformSupabaseProductToAppProduct(productData: any): Product {
  return {
    id: productData.id,
    storeId: productData.store_id,
    categoryId: productData.category_id || undefined,
    name: productData.name,
    shortDescription: productData.short_description || undefined,
    longDescription: productData.long_description || undefined,
    price: parseFloat(productData.price),
    mainImage: productData.main_image || undefined,
    gallery: productData.gallery || [],
    isActive: productData.is_active ?? true,
    isFeatured: productData.is_featured ?? false,
    createdAt: productData.created_at,
    updatedAt: productData.updated_at,
  };
}

function transformAppStoreToSupabaseUpdate(storeData: Partial<Store>) {
  const supabaseData: any = {};
  
  if (storeData.name !== undefined) supabaseData.name = storeData.name;
  if (storeData.slug !== undefined) supabaseData.slug = storeData.slug;
  if (storeData.description !== undefined) supabaseData.description = storeData.description;
  if (storeData.logo !== undefined) supabaseData.logo = storeData.logo;
  if (storeData.whatsapp !== undefined) supabaseData.whatsapp = storeData.whatsapp;
  if (storeData.currency !== undefined) supabaseData.currency = storeData.currency;
  if (storeData.headingFont !== undefined) supabaseData.heading_font = storeData.headingFont;
  if (storeData.bodyFont !== undefined) supabaseData.body_font = storeData.bodyFont;
  if (storeData.colorPalette !== undefined) supabaseData.color_palette = storeData.colorPalette;
  if (storeData.borderRadius !== undefined) supabaseData.border_radius = storeData.borderRadius;
  if (storeData.productsPerPage !== undefined) supabaseData.products_per_page = storeData.productsPerPage;
  if (storeData.facebookUrl !== undefined) supabaseData.facebook_url = storeData.facebookUrl;
  if (storeData.instagramUrl !== undefined) supabaseData.instagram_url = storeData.instagramUrl;
  if (storeData.tiktokUrl !== undefined) supabaseData.tiktok_url = storeData.tiktokUrl;
  if (storeData.twitterUrl !== undefined) supabaseData.twitter_url = storeData.twitterUrl;
  if (storeData.showSocialInCatalog !== undefined) supabaseData.show_social_in_catalog = storeData.showSocialInCatalog;
  if (storeData.acceptCash !== undefined) supabaseData.accept_cash = storeData.acceptCash;
  if (storeData.acceptBankTransfer !== undefined) supabaseData.accept_bank_transfer = storeData.acceptBankTransfer;
  if (storeData.bankDetails !== undefined) supabaseData.bank_details = storeData.bankDetails;
  if (storeData.allowPickup !== undefined) supabaseData.allow_pickup = storeData.allowPickup;
  if (storeData.allowDelivery !== undefined) supabaseData.allow_delivery = storeData.allowDelivery;
  if (storeData.deliveryCost !== undefined) supabaseData.delivery_cost = storeData.deliveryCost;
  if (storeData.deliveryZone !== undefined) supabaseData.delivery_zone = storeData.deliveryZone;
  if (storeData.messageGreeting !== undefined) supabaseData.message_greeting = storeData.messageGreeting;
  if (storeData.messageIntroduction !== undefined) supabaseData.message_introduction = storeData.messageIntroduction;
  if (storeData.messageClosing !== undefined) supabaseData.message_closing = storeData.messageClosing;
  if (storeData.includePhoneInMessage !== undefined) supabaseData.include_phone_in_message = storeData.includePhoneInMessage;
  if (storeData.includeCommentsInMessage !== undefined) supabaseData.include_comments_in_message = storeData.includeCommentsInMessage;
  
  // Always update the updated_at timestamp
  supabaseData.updated_at = new Date().toISOString();
  
  return supabaseData;
}

// Proveedor de contexto
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  // Función para obtener límites por plan
  const getMaxStores = (): number => {
    const userPlan = state.user?.plan || 'gratuito';
    switch (userPlan) {
      case 'gratuito': return 1;
      case 'emprendedor': return 2;
      case 'profesional': return 5;
      default: return 1;
    }
  };

  const getMaxProducts = (): number => {
    const userPlan = state.user?.plan || 'gratuito';
    switch (userPlan) {
      case 'gratuito': return 10;
      case 'emprendedor': return 30;
      case 'profesional': return 50;
      default: return 10;
    }
  };

  const getMaxCategories = (): number => {
    const userPlan = state.user?.plan || 'gratuito';
    switch (userPlan) {
      case 'gratuito': return 3;
      case 'emprendedor': return 999999; // Ilimitadas
      case 'profesional': return 999999; // Ilimitadas
      default: return 3;
    }
  };

  // Función para verificar si puede crear tiendas
  const canCreateStore = (): boolean => {
    const maxStores = getMaxStores();
    const currentStoreCount = state.stores.length;
    return currentStoreCount < maxStores;
  };

  // Función para crear tienda
  const createStore = async (storeData: Omit<Store, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'categories' | 'products'>): Promise<Store> => {
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar límites
    if (!canCreateStore()) {
      const maxStores = getMaxStores();
      throw new Error(`Has alcanzado el límite de ${maxStores} tienda(s) para tu plan ${state.user.plan}. Actualiza tu plan para crear más tiendas.`);
    }

    // Verificar que el slug no exista
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', storeData.slug)
      .limit(1);

    if (existingStore && existingStore.length > 0) {
      throw new Error('Esta URL ya está en uso. Por favor elige otra.');
    }

    // Crear tienda en Supabase
    const { data, error } = await supabase
      .from('stores')
      .insert({
        user_id: state.user.id,
        name: storeData.name,
        slug: storeData.slug,
        description: storeData.description,
        logo: storeData.logo,
        whatsapp: storeData.whatsapp,
        currency: storeData.currency,
        heading_font: storeData.headingFont,
        body_font: storeData.bodyFont,
        color_palette: storeData.colorPalette,
        border_radius: storeData.borderRadius,
        products_per_page: storeData.productsPerPage,
        facebook_url: storeData.facebookUrl,
        instagram_url: storeData.instagramUrl,
        tiktok_url: storeData.tiktokUrl,
        twitter_url: storeData.twitterUrl,
        show_social_in_catalog: storeData.showSocialInCatalog,
        accept_cash: storeData.acceptCash,
        accept_bank_transfer: storeData.acceptBankTransfer,
        bank_details: storeData.bankDetails,
        allow_pickup: storeData.allowPickup,
        allow_delivery: storeData.allowDelivery,
        delivery_cost: storeData.deliveryCost,
        delivery_zone: storeData.deliveryZone,
        message_greeting: storeData.messageGreeting,
        message_introduction: storeData.messageIntroduction,
        message_closing: storeData.messageClosing,
        include_phone_in_message: storeData.includePhoneInMessage,
        include_comments_in_message: storeData.includeCommentsInMessage,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating store:', error);
      throw new Error('No se pudo crear la tienda. Intenta de nuevo.');
    }

    const newStore = transformSupabaseStoreToAppStore(data, [], []);
    dispatch({ type: 'ADD_STORE', payload: newStore });
    
    return newStore;
  };

  // Función para actualizar tienda
  const updateStore = async (storeData: Partial<Store>): Promise<void> => {
    if (!state.currentStore) {
      throw new Error('No hay tienda seleccionada para actualizar');
    }

    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar que el slug no exista en otra tienda (si se está actualizando el slug)
    if (storeData.slug && storeData.slug !== state.currentStore.slug) {
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', storeData.slug)
        .neq('id', state.currentStore.id)
        .limit(1);

      if (existingStore && existingStore.length > 0) {
        throw new Error('Esta URL ya está en uso. Por favor elige otra.');
      }
    }

    // Transformar datos para Supabase
    const supabaseUpdateData = transformAppStoreToSupabaseUpdate(storeData);

    // Actualizar en Supabase
    const { data, error } = await supabase
      .from('stores')
      .update(supabaseUpdateData)
      .eq('id', state.currentStore.id)
      .eq('user_id', state.user.id) // Seguridad adicional
      .select()
      .single();

    if (error) {
      console.error('Error updating store:', error);
      throw new Error('No se pudo actualizar la tienda. Intenta de nuevo.');
    }

    // Actualizar estado local
    const updatedStoreData = transformSupabaseStoreToAppStore(data, state.currentStore.categories, state.currentStore.products);
    dispatch({ type: 'UPDATE_STORE', payload: updatedStoreData });
  };

  // Función para crear categoría
  const createCategory = async (categoryData: Omit<Category, 'id' | 'storeId' | 'createdAt'>): Promise<Category> => {
    if (!state.currentStore) {
      throw new Error('No hay tienda seleccionada');
    }

    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    // Crear categoría en Supabase
    const { data, error } = await supabase
      .from('categories')
      .insert({
        store_id: state.currentStore.id,
        name: categoryData.name.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      if (error.message.includes('límite')) {
        throw new Error(error.message);
      }
      throw new Error('No se pudo crear la categoría. Intenta de nuevo.');
    }

    const newCategory = transformSupabaseCategoryToAppCategory(data);
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    
    return newCategory;
  };

  // Función para actualizar categoría
  const updateCategory = async (categoryData: Category): Promise<void> => {
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: categoryData.name.trim(),
      })
      .eq('id', categoryData.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw new Error('No se pudo actualizar la categoría. Intenta de nuevo.');
    }

    const updatedCategory = transformSupabaseCategoryToAppCategory(data);
    dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
  };

  // Función para eliminar categoría
  const deleteCategory = async (categoryId: string): Promise<void> => {
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      throw new Error('No se pudo eliminar la categoría. Intenta de nuevo.');
    }

    dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });
  };

  // Función para crear producto
  const createProduct = async (productData: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    if (!state.currentStore) {
      throw new Error('No hay tienda seleccionada');
    }

    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    // Crear producto en Supabase
    const { data, error } = await supabase
      .from('products')
      .insert({
        store_id: state.currentStore.id,
        category_id: productData.categoryId || null,
        name: productData.name.trim(),
        short_description: productData.shortDescription?.trim() || null,
        long_description: productData.longDescription?.trim() || null,
        price: productData.price,
        main_image: productData.mainImage || null,
        gallery: productData.gallery || [],
        is_active: productData.isActive,
        is_featured: productData.isFeatured,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      if (error.message.includes('límite')) {
        throw new Error(error.message);
      }
      throw new Error('No se pudo crear el producto. Intenta de nuevo.');
    }

    const newProduct = transformSupabaseProductToAppProduct(data);
    dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    
    return newProduct;
  };

  // Función para actualizar producto
  const updateProduct = async (productData: Product): Promise<void> => {
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        category_id: productData.categoryId || null,
        name: productData.name.trim(),
        short_description: productData.shortDescription?.trim() || null,
        long_description: productData.longDescription?.trim() || null,
        price: productData.price,
        main_image: productData.mainImage || null,
        gallery: productData.gallery || [],
        is_active: productData.isActive,
        is_featured: productData.isFeatured,
      })
      .eq('id', productData.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw new Error('No se pudo actualizar el producto. Intenta de nuevo.');
    }

    const updatedProduct = transformSupabaseProductToAppProduct(data);
    dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
  };

  // Función para eliminar producto
  const deleteProduct = async (productId: string): Promise<void> => {
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      throw new Error('No se pudo eliminar el producto. Intenta de nuevo.');
    }

    dispatch({ type: 'DELETE_PRODUCT', payload: productId });
  };

  // Función de login
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const appUser = transformSupabaseUserToAppUser(data.user, userData);
      dispatch({ type: 'SET_USER', payload: appUser });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });

      // Cargar tiendas del usuario
      await loadUserStores(data.user.id);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función de registro
  const register = async (email: string, password: string, name: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { name }
        }
      });
      if (error) throw error;
      
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          name: name,
          plan: 'gratuito'
        });

        const appUser = transformSupabaseUserToAppUser(data.user, { name, plan: 'gratuito' });
        dispatch({ type: 'SET_USER', payload: appUser });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });

        // Cargar tiendas del usuario (debería estar vacío para nuevos usuarios)
        await loadUserStores(data.user.id);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función para cargar tiendas del usuario con categorías y productos
  const loadUserStores = async (userId: string) => {
    try {
      // Cargar tiendas
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (storesError) {
        console.error('Error loading stores:', storesError);
        return;
      }

      if (!storesData || storesData.length === 0) {
        dispatch({ type: 'SET_STORES', payload: [] });
        return;
      }

      // Cargar categorías para todas las tiendas
      const storeIds = storesData.map(store => store.id);
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .in('store_id', storeIds)
        .order('created_at', { ascending: true });

      // Cargar productos para todas las tiendas
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .in('store_id', storeIds)
        .order('created_at', { ascending: true });

      // Organizar datos por tienda
      const stores = storesData.map(storeData => {
        const storeCategories = (categoriesData || [])
          .filter(cat => cat.store_id === storeData.id)
          .map(transformSupabaseCategoryToAppCategory);
        
        const storeProducts = (productsData || [])
          .filter(prod => prod.store_id === storeData.id)
          .map(transformSupabaseProductToAppProduct);

        return transformSupabaseStoreToAppStore(storeData, storeCategories, storeProducts);
      });

      dispatch({ type: 'SET_STORES', payload: stores });

      // Set first store as current if exists
      if (stores.length > 0) {
        dispatch({ type: 'SET_CURRENT_STORE', payload: stores[0] });
      }
    } catch (error) {
      console.error('Error loading user stores:', error);
    }
  };

  // 🔥 CRITICAL: Robust authentication initialization
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🔄 Starting authentication initialization...');
        
        // 🚀 IMPROVED: Use getSession for better persistence
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('⚠️ Session error:', sessionError);
        }
        
        if (session?.user && isMounted) {
          console.log('✅ User session found:', session.user.id);
          
          // User is authenticated - get user data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            console.warn('⚠️ Error fetching user data:', userError);
          }

          const appUser = transformSupabaseUserToAppUser(session.user, userData);
          dispatch({ type: 'SET_USER', payload: appUser });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });

          // Load user stores
          await loadUserStores(session.user.id);
          console.log('✅ User data and stores loaded successfully');
        } else if (isMounted) {
          console.log('ℹ️ No user session found');
          dispatch({ type: 'SET_AUTHENTICATED', payload: false });
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          dispatch({ type: 'SET_AUTHENTICATED', payload: false });
        }
      } finally {
        if (isMounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_INITIALIZED', payload: true });
          console.log('🏁 Authentication initialization finished');
        }
      }
    };

    initializeAuth();

    // 🔄 Listen for auth changes with improved handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('🔄 Auth state change:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('👋 User signed out');
        dispatch({ type: 'LOGOUT' });
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('👋 User signed in:', session.user.id);
        
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const appUser = transformSupabaseUserToAppUser(session.user, userData);
        dispatch({ type: 'SET_USER', payload: appUser });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });

        await loadUserStores(session.user.id);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed for user:', session.user.id);
        // Token refreshed - user is still authenticated
        // No need to reload everything, just ensure state is correct
        if (!state.isAuthenticated) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const appUser = transformSupabaseUserToAppUser(session.user, userData);
          dispatch({ type: 'SET_USER', payload: appUser });
          dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <StoreContext.Provider value={{ 
      state, 
      dispatch, 
      login, 
      register, 
      createStore,
      updateStore,
      createCategory,
      updateCategory,
      deleteCategory,
      createProduct,
      updateProduct,
      deleteProduct,
      canCreateStore,
      getMaxStores,
      getMaxProducts,
      getMaxCategories
    }}>
      {children}
    </StoreContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

export default StoreContext;
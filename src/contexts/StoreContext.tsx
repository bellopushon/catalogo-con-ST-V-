import React, { createContext, useContext, useReducer, useEffect, Dispatch, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

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
  plan: string; // ID del plan (gratuito, emprendedor, profesional, etc.)
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'expired';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionCanceledAt?: string;
  paymentMethod?: string;
  stripeCustomerId?: string; // ID del cliente en Stripe
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  is_active: boolean;
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
  status: 'active' | 'suspended' | 'archived';
  createdAt: string;
  updatedAt: string;
  // Relaciones
  categories: Category[];
  products: Product[];
}

// Definición de plan
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  maxStores: number;
  maxProducts: number;
  maxCategories: number;
  features: string[];
  isActive: boolean;
  isFree: boolean;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreState {
  user: User | null;
  stores: Store[];
  currentStore: Store | null;
  plans: Plan[]; // Planes disponibles
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  authError: string | null;
}

// Definición del estado inicial
const initialState: StoreState = {
  user: null,
  stores: [],
  currentStore: null,
  plans: [],
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  authError: null,
};

// Tipos de acciones
type ActionType =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_STORES'; payload: Store[] }
  | { type: 'SET_CURRENT_STORE'; payload: Store | null }
  | { type: 'SET_PLANS'; payload: Plan[] }
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
  | { type: 'SET_AUTH_ERROR'; payload: string | null }
  | { type: 'LOGOUT' }
  | { type: 'REACTIVATE_STORE'; payload: string };

// Reducer
function storeReducer(state: StoreState, action: ActionType): StoreState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_CURRENT_STORE':
      return { ...state, currentStore: action.payload };
    case 'SET_PLANS':
      return { ...state, plans: action.payload };
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
    case 'SET_AUTH_ERROR':
      return { ...state, authError: action.payload };
    case 'LOGOUT':
      return {
        ...initialState,
        isInitialized: true,
        isLoading: false
      };
    case 'REACTIVATE_STORE':
      const reactivatedStores = state.stores.map(store =>
        store.id === action.payload
          ? { ...store, status: 'active' as 'active' }
          : store
      );
      return {
        ...state,
        stores: reactivatedStores,
        currentStore: state.currentStore?.id === action.payload
          ? { ...state.currentStore, status: 'active' as 'active' }
          : state.currentStore
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
  logout: () => Promise<void>;
  createStore: (storeData: Omit<Store, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'categories' | 'products'>) => Promise<Store>;
  updateStore: (storeData: Partial<Store>) => Promise<void>;
  createCategory: (categoryData: Omit<Category, 'id' | 'storeId' | 'createdAt'>) => Promise<Category>;
  updateCategory: (categoryData: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  createProduct: (productData: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (productData: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  // Funciones para planes
  loadPlans: () => Promise<void>;
  getFreePlan: () => Plan | null;
  getUserPlan: (user: User | null) => Plan | null;
  getPlanByLevel: (level: number) => Plan | null;
  getMaxLimitForUser: (user: User | null, type: 'stores' | 'products' | 'categories') => number;
  canCreateStore: () => boolean;
  getMaxStores: () => number;
  getMaxProducts: () => number;
  getMaxCategories: () => number;
  // NUEVO: Exponer si el usuario excede el límite de tiendas activas
  hasStoreLimitExceeded: boolean;
  // NUEVO: Función para suspender tiendas
  suspendStores: (storeIds: string[]) => Promise<void>;
  reactivateStore: (storeId: string) => Promise<void>;
}>({
  state: initialState,
  dispatch: () => null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  createStore: async () => ({} as Store),
  updateStore: async () => {},
  createCategory: async () => ({} as Category),
  updateCategory: async () => {},
  deleteCategory: async () => {},
  createProduct: async () => ({} as Product),
  updateProduct: async () => {},
  deleteProduct: async () => {},
  // Implementaciones por defecto para planes
  loadPlans: async () => {},
  getFreePlan: () => null,
  getUserPlan: () => null,
  getPlanByLevel: () => null,
  getMaxLimitForUser: () => 0,
  canCreateStore: () => false,
  getMaxStores: () => 1,
  getMaxProducts: () => 10,
  getMaxCategories: () => 3,
  hasStoreLimitExceeded: false,
  suspendStores: async () => {},
  reactivateStore: async () => {},
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
    stripeCustomerId: userData?.stripe_customer_id || undefined,
    createdAt: userData?.created_at || undefined,
    updatedAt: userData?.updated_at || undefined,
  };
}

// Transformar planes de Supabase
function transformSupabasePlanToAppPlan(planData: any): Plan {
  return {
    id: planData.id,
    name: planData.name,
    description: planData.description,
    price: parseFloat(planData.price),
    maxStores: planData.max_stores,
    maxProducts: planData.max_products,
    maxCategories: planData.max_categories,
    features: planData.features || [],
    isActive: planData.is_active ?? true,
    isFree: planData.is_free ?? false,
    level: planData.level || 1,
    createdAt: planData.created_at,
    updatedAt: planData.updated_at,
  };
}

function transformSupabaseStoreToAppStore(storeData: any, categories: Category[] = [], products: Product[] = []): Store {
  return {
    id: storeData.id,
    userId: storeData.user_id,
    name: storeData.name,
    slug: storeData.slug,
    description: storeData.description,
    logo: storeData.logo,
    whatsapp: storeData.whatsapp,
    currency: storeData.currency,
    headingFont: storeData.heading_font,
    bodyFont: storeData.body_font,
    colorPalette: storeData.color_palette,
    borderRadius: storeData.border_radius,
    productsPerPage: storeData.products_per_page,
    facebookUrl: storeData.facebook_url,
    instagramUrl: storeData.instagram_url,
    tiktokUrl: storeData.tiktok_url,
    twitterUrl: storeData.twitter_url,
    showSocialInCatalog: storeData.show_social_in_catalog ?? true,
    acceptCash: storeData.accept_cash ?? true,
    acceptBankTransfer: storeData.accept_bank_transfer ?? true,
    bankDetails: storeData.bank_details,
    allowPickup: storeData.allow_pickup ?? true,
    allowDelivery: storeData.allow_delivery ?? true,
    deliveryCost: storeData.delivery_cost ?? 0,
    deliveryZone: storeData.delivery_zone,
    messageGreeting: storeData.message_greeting,
    messageIntroduction: storeData.message_introduction,
    messageClosing: storeData.message_closing,
    includePhoneInMessage: storeData.include_phone_in_message ?? true,
    includeCommentsInMessage: storeData.include_comments_in_message ?? true,
    status: storeData.status || 'active',
    createdAt: storeData.created_at,
    updatedAt: storeData.updated_at,
    categories,
    products
  };
}

function transformSupabaseCategoryToAppCategory(categoryData: any): Category {
  return {
    id: categoryData.id,
    storeId: categoryData.store_id,
    name: categoryData.name,
    is_active: categoryData.is_active ?? true,
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
  const update: any = {};
  
  if (storeData.name !== undefined) update.name = storeData.name;
  if (storeData.slug !== undefined) update.slug = storeData.slug;
  if (storeData.description !== undefined) update.description = storeData.description;
  if (storeData.logo !== undefined) update.logo = storeData.logo;
  if (storeData.whatsapp !== undefined) update.whatsapp = storeData.whatsapp;
  if (storeData.currency !== undefined) update.currency = storeData.currency;
  if (storeData.headingFont !== undefined) update.heading_font = storeData.headingFont;
  if (storeData.bodyFont !== undefined) update.body_font = storeData.bodyFont;
  if (storeData.colorPalette !== undefined) update.color_palette = storeData.colorPalette;
  if (storeData.borderRadius !== undefined) update.border_radius = storeData.borderRadius;
  if (storeData.productsPerPage !== undefined) update.products_per_page = storeData.productsPerPage;
  if (storeData.facebookUrl !== undefined) update.facebook_url = storeData.facebookUrl;
  if (storeData.instagramUrl !== undefined) update.instagram_url = storeData.instagramUrl;
  if (storeData.tiktokUrl !== undefined) update.tiktok_url = storeData.tiktokUrl;
  if (storeData.twitterUrl !== undefined) update.twitter_url = storeData.twitterUrl;
  if (storeData.showSocialInCatalog !== undefined) update.show_social_in_catalog = storeData.showSocialInCatalog;
  if (storeData.acceptCash !== undefined) update.accept_cash = storeData.acceptCash;
  if (storeData.acceptBankTransfer !== undefined) update.accept_bank_transfer = storeData.acceptBankTransfer;
  if (storeData.bankDetails !== undefined) update.bank_details = storeData.bankDetails;
  if (storeData.allowPickup !== undefined) update.allow_pickup = storeData.allowPickup;
  if (storeData.allowDelivery !== undefined) update.allow_delivery = storeData.allowDelivery;
  if (storeData.deliveryCost !== undefined) update.delivery_cost = storeData.deliveryCost;
  if (storeData.deliveryZone !== undefined) update.delivery_zone = storeData.deliveryZone;
  if (storeData.messageGreeting !== undefined) update.message_greeting = storeData.messageGreeting;
  if (storeData.messageIntroduction !== undefined) update.message_introduction = storeData.messageIntroduction;
  if (storeData.messageClosing !== undefined) update.message_closing = storeData.messageClosing;
  if (storeData.includePhoneInMessage !== undefined) update.include_phone_in_message = storeData.includePhoneInMessage;
  if (storeData.includeCommentsInMessage !== undefined) update.include_comments_in_message = storeData.includeCommentsInMessage;
  if (storeData.status !== undefined) update.status = storeData.status;
  
  return update;
}

// --- Lógica de desactivación automática de productos excedentes ---
async function enforceProductLimitsOnStore(store: Store, user: User, userPlan: Plan): Promise<void> {
  const maxProducts = userPlan.maxProducts;
  const activeProducts = store.products.filter(p => p.isActive);
  if (activeProducts.length > maxProducts) {
    // Ordenar por fecha de creación (más antiguos primero)
    const productsToKeep = activeProducts.slice(0, maxProducts);
    const productsToDeactivate = activeProducts.slice(maxProducts);
    for (const product of productsToDeactivate) {
      await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', product.id);
    }
  }
}

// --- Lógica de reactivación controlada ---
async function tryReactivateProduct(productId: string, store: Store, user: User, userPlan: Plan): Promise<boolean> {
  const maxProducts = userPlan.maxProducts;
  const activeProducts = store.products.filter(p => p.isActive);
  if (activeProducts.length >= maxProducts) {
    // No permitir reactivar
    return false;
  }
  // Reactivar en Supabase
  await supabase
    .from('products')
    .update({ is_active: true })
    .eq('id', productId);
  return true;
}

// --- Hook para aplicar la lógica al cargar tiendas o cambiar de plan ---
async function enforceLimitsOnAllStores(stores: Store[], user: User, userPlan: Plan) {
  for (const store of stores) {
    await enforceProductLimitsOnStore(store, user, userPlan);
  }
}

// Proveedor de contexto
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);
  const location = useLocation();

  // Inicialización de autenticación solo para rutas protegidas
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        console.log('🔄 Initializing authentication...');
console.log('🔐 checkAuth - Verificando autenticación...'); // AGREGA ESTA LÍNEA
        
        // Obtener la sesión actual de Supabase primero
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (isMounted) {
            dispatch({ type: 'SET_AUTH_ERROR', payload: sessionError.message });
            dispatch({ type: 'SET_AUTHENTICATED', payload: false });
            dispatch({ type: 'SET_INITIALIZED', payload: true });
          }
          return;
        }

        // Cargar planes primero, independientemente de si hay sesión o no
        try {
          await loadPlans();
        } catch (error) {
          console.error('❌ Error loading plans:', error);
          // No fallar la inicialización por esto, continuar con el proceso
        }

        // Si hay una sesión activa, cargar datos del usuario
        if (session?.user) {
          console.log('✅ User found in session:', session.user.id);
          
          try {
            // Obtener datos del usuario
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userError) {
              console.error('❌ Error fetching user data:', userError);
            }

            if (isMounted) {
              // Si el usuario existe pero no tiene un plan asignado o tiene un plan inválido,
              // asignarle el plan gratuito
              if (userData) {
                const freePlan = getFreePlan();
                
                // Verificar si el plan del usuario es válido
                const userPlanIsValid = state.plans.some(p => p.id === userData.plan);
                
                if (!userData.plan || !userPlanIsValid) {
                  console.log('⚠️ User has invalid plan, updating to free plan');
                  
                  if (freePlan) {
                    // Actualizar el plan del usuario en la base de datos
                    await supabase
                      .from('users')
                      .update({ plan: freePlan.id })
                      .eq('id', session.user.id);
                    
                    // Actualizar el plan en userData para el estado local
                    userData.plan = freePlan.id;
                  }
                }
              }
              
              const appUser = transformSupabaseUserToAppUser(session.user, userData || {});
              if (appUser) {
                console.log('✅ Usuario autenticado:', appUser.email);
                dispatch({ type: 'SET_USER', payload: appUser });
                dispatch({ type: 'SET_AUTHENTICATED', payload: true });

                // Cargar tiendas del usuario
                try {
                  await loadUserStores(session.user.id);
                } catch (error) {
                  console.error('❌ Error loading stores:', error);
                }
              }
            }
          } catch (error) {
            console.error('❌ Error during initialization:', error);
            if (isMounted && session?.user) {
              const appUser = transformSupabaseUserToAppUser(session.user, {});
              if (appUser) {
                dispatch({ type: 'SET_USER', payload: appUser });
                dispatch({ type: 'SET_AUTHENTICATED', payload: true });
              }
            }
          }
        } else {
          console.log('ℹ️ No user session found');
          if (isMounted) {
            dispatch({ type: 'SET_AUTHENTICATED', payload: false });
          }
        }
      } catch (error: any) {
        console.error('❌ Auth initialization failed:', error);
        if (isMounted) {
          dispatch({ type: 'SET_AUTH_ERROR', payload: error.message });
          dispatch({ type: 'SET_AUTHENTICATED', payload: false });
        }
      } finally {
        // SIEMPRE marcar como inicializado al final
        if (isMounted) {
          dispatch({ type: 'SET_INITIALIZED', payload: true });
          console.log('✅ Authentication initialization complete');
        }
      }
    };

    // Inicializar autenticación
    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('🔄 Auth state changed:', event);
      
      // Solo manejar los eventos relevantes
      if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' });
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Solo actualizar si es un nuevo login, no en el inicial
        if (state.isInitialized) {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const appUser = transformSupabaseUserToAppUser(session.user, userData);
            console.log('✅ Usuario autenticado (fallback):', appUser.email);
            dispatch({ type: 'SET_USER', payload: appUser });
            dispatch({ type: 'SET_AUTHENTICATED', payload: true });

            await loadPlans();
            await loadUserStores(session.user.id);
          } catch (error) {
            console.error('❌ Error handling auth state change:', error);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [location.pathname]);

  // Función para cargar planes desde la base de datos
  const loadPlans = async (): Promise<void> => {
    try {
      console.log('🔄 Loading plans from database...');
      
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (plansError) {
        console.error('❌ Error loading plans:', plansError);
        return;
      }

      if (plansData && plansData.length > 0) {
        const plans = plansData.map(transformSupabasePlanToAppPlan);
        dispatch({ type: 'SET_PLANS', payload: plans });
        console.log('✅ Plans loaded successfully:', plans.length);
      } else {
        console.warn('⚠️ No active plans found in database');
      }
    } catch (error) {
      console.error('❌ Exception loading plans:', error);
    }
  };

  // Obtener plan gratuito
  const getFreePlan = (): Plan | null => {
    if (!state.plans || state.plans.length === 0) {
      console.warn('⚠️ No hay planes disponibles');
      return null;
    }
    
    const freePlan = state.plans.find(plan => plan.isFree && plan.isActive);
    if (!freePlan) {
      console.warn('⚠️ No se encontró un plan gratuito');
      return null;
    }
    
    return freePlan;
  };

  // Obtener plan del usuario
  const getUserPlan = (user: User | null): Plan | null => {
    if (!user) return getFreePlan();
    
    // Si no hay planes cargados, devolver un plan por defecto
    if (state.plans.length === 0) {
      console.warn('⚠️ No plans loaded, returning default plan');
      return {
        id: 'gratuito',
        name: 'Gratuito',
        description: 'Plan gratuito',
        price: 0,
        maxStores: 1,
        maxProducts: 10,
        maxCategories: 3,
        features: [],
        isActive: true,
        isFree: true,
        level: 1,
        createdAt: '',
        updatedAt: ''
      };
    }
    
    // Buscar plan por ID
    const userPlan = state.plans.find(plan => plan.id === user.plan);
    
    if (userPlan) return userPlan;
    
    // Si no se encuentra, intentar buscar por nombre (compatibilidad)
    const planByName = state.plans.find(
      plan => plan.name.toLowerCase() === user.plan.toLowerCase()
    );
    
    if (planByName) return planByName;
    
    // Si no se encuentra ningún plan, devolver el plan gratuito
    const freePlan = getFreePlan();
    
    if (!freePlan) {
      console.error('❌ No free plan found and user plan not found:', user.plan);
    }
    
    return freePlan;
  };

  // Obtener plan por nivel
  const getPlanByLevel = (level: number): Plan | null => {
    return state.plans.find(plan => plan.level === level && plan.isActive) || null;
  };

  // Obtener límite máximo para usuario
  const getMaxLimitForUser = (user: User | null, type: 'stores' | 'products' | 'categories'): number => {
    const userPlan = getUserPlan(user);
    if (!userPlan) {
      // Fallback a valores por defecto si no hay plan
      switch (type) {
        case 'stores': return 1;
        case 'products': return 10;
        case 'categories': return 3;
        default: return 0;
      }
    }
    
    switch (type) {
      case 'stores': return userPlan.maxStores;
      case 'products': return userPlan.maxProducts;
      case 'categories': return userPlan.maxCategories;
      default: return 0;
    }
  };

  // Funciones de límites ahora dinámicas
  const getMaxStores = (): number => {
    return getMaxLimitForUser(state.user, 'stores');
  };

  const getMaxProducts = (): number => {
    return getMaxLimitForUser(state.user, 'products');
  };

  const getMaxCategories = (): number => {
    return getMaxLimitForUser(state.user, 'categories');
  };

  // Función para verificar si puede crear tiendas
  const canCreateStore = (): boolean => {
    const maxStores = getMaxStores();
    const currentStoreCount = state.stores.length;
    return currentStoreCount < maxStores;
  };

  // Función para cerrar sesión
  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('🔄 Executing logout process...');
      
      // Limpiar localStorage manualmente para asegurar que se eliminen todos los tokens
      localStorage.removeItem('sb-dpggztqltotvvfqmlvny-auth-token');
      localStorage.removeItem('tutaviendo-auth-token');
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Supabase signOut error:', error);
        throw error;
      }
      
      // Limpiar estado local
      dispatch({ type: 'LOGOUT' });
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Forzar logout local incluso si falla el logout remoto
      dispatch({ type: 'LOGOUT' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función para crear tienda
  const createStore = async (storeData: Omit<Store, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'categories' | 'products'>): Promise<Store> => {
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar límites dinámicamente
    if (!canCreateStore()) {
      const maxStores = getMaxStores();
      const userPlan = getUserPlan(state.user);
      const planName = userPlan?.name || 'actual';
      throw new Error(`Has alcanzado el límite de ${maxStores} tienda(s) para tu plan ${planName}. Actualiza tu plan para crear más tiendas.`);
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

    // Verificar límites dinámicamente
    const maxCategories = getMaxCategories();
    const currentCategoryCount = state.currentStore.categories.length;
    
    if (currentCategoryCount >= maxCategories) {
      const userPlan = getUserPlan(state.user);
      const planName = userPlan?.name || 'actual';
      throw new Error(`Has alcanzado el límite de ${maxCategories} categoría(s) para tu plan ${planName}. Actualiza tu plan para crear más categorías.`);
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
    if (!state.user || !state.currentStore) {
      throw new Error('No hay usuario o tienda seleccionada');
    }

    // Reasignar productos a null (sin categoría)
    await supabase
      .from('products')
      .update({ category_id: null })
      .eq('store_id', state.currentStore.id)
      .eq('category_id', categoryId);

    // Eliminar la categoría
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

    // Verificar límites dinámicamente
    const maxProducts = getMaxProducts();
    const currentProductCount = state.currentStore.products.length;
    
    if (currentProductCount >= maxProducts) {
      const userPlan = getUserPlan(state.user);
      const planName = userPlan?.name || 'actual';
      throw new Error(`Has alcanzado el límite de ${maxProducts} producto(s) para tu plan ${planName}. Actualiza tu plan para crear más productos.`);
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

    // Lógica para evitar activar productos si se supera el límite
    if (productData.isActive) {
      // Buscar la tienda actual
      const store = state.currentStore;
      if (store) {
        const userPlan = getUserPlan(state.user);
        const maxProducts = userPlan?.maxProducts || 10;
        const activeProducts = store.products.filter(p => p.isActive && p.id !== productData.id);
        if (activeProducts.length >= maxProducts) {
          throw new Error(`No puedes activar más productos. Has alcanzado el límite de ${maxProducts} productos activos para tu plan. Elimina o desactiva otro producto para poder activar este.`);
        }
      }
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
      throw new Error(error.message || 'No se pudo actualizar el producto. Intenta de nuevo.');
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
      dispatch({ type: 'SET_AUTH_ERROR', payload: null });
      
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

      // Cargar planes y tiendas del usuario
      await loadPlans();
      await loadUserStores(data.user.id);
      
      console.log('✅ Login successful');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      dispatch({ type: 'SET_AUTH_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función de registro
  const register = async (email: string, password: string, name: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_AUTH_ERROR', payload: null });
      
      // Primero cargar planes para asegurarnos de que estén disponibles
      await loadPlans();
      
      // Obtener el plan gratuito de la base de datos
      const freePlan = getFreePlan();
      
      if (!freePlan) {
        console.error('❌ No free plan found in database');
        throw new Error('No se pudo encontrar un plan gratuito. Por favor contacta al soporte.');
      }
      
      console.log('✅ Using free plan for registration:', freePlan.id, freePlan.name);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { name }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Insertar usuario en la tabla users con el plan gratuito de la base de datos
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          name: name,
          plan: freePlan.id  // Usar el ID del plan gratuito de la base de datos
        });
        
        if (insertError) {
          console.error('❌ Error inserting user data:', insertError);
          throw insertError;
        }

        const appUser = transformSupabaseUserToAppUser(data.user, { 
          name, 
          plan: freePlan.id,
          created_at: new Date().toISOString()
        });
        
        dispatch({ type: 'SET_USER', payload: appUser });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });

        // Cargar tiendas del usuario (no debería haber ninguna todavía)
        await loadUserStores(data.user.id);
        
        console.log('✅ Registration successful with plan:', freePlan.name);
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      dispatch({ type: 'SET_AUTH_ERROR', payload: error.message });
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

      // Lógica de suspensión automática según el plan
      const user = state.user;
      if (user) {
        const maxStores = getMaxLimitForUser(user, 'stores');
        // Filtrar tiendas activas
        const activeStores = storesData.filter(store => store.status === 'active');
        if (activeStores.length > maxStores) {
          // Ordenar por fecha de creación (más antiguas primero)
          const storesToSuspend = activeStores.slice(0, activeStores.length - maxStores);
          const suspendIds = storesToSuspend.map(store => store.id);
          // Actualizar en Supabase
          if (suspendIds.length > 0) {
            await supabase
              .from('stores')
              .update({ status: 'suspended' })
              .in('id', suspendIds);
            // Reflejar el cambio localmente
            storesData.forEach(store => {
              if (suspendIds.includes(store.id)) {
                store.status = 'suspended';
              }
            });
          }
        }
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

      // Aplicar lógica de desactivación automática de productos excedentes
      if (user) {
        const userPlan = getUserPlan(user);
        if (userPlan) {
          await enforceLimitsOnAllStores(stores, user, userPlan);
        }
      }
    } catch (error) {
      console.error('Error loading user stores:', error);
    }
  };

  // Listener para cambios de plan desde superadministrador
  useEffect(() => {
    if (state.user?.id && state.isInitialized) {
      console.log('🔄 Setting up real-time plan change listener for user:', state.user.id);
      
      const channel = supabase
        .channel('user-plan-changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${state.user.id}`
        }, async (payload) => {
          console.log('🔄 Plan actualizado desde super admin:', payload);
          
          const newUserData = payload.new;
          const oldUserData = payload.old;
          
          // Verificar si el plan cambió
          if (newUserData.plan !== oldUserData.plan) {
            console.log(`📈 Plan changed from ${oldUserData.plan} to ${newUserData.plan}`);
            
            // Actualizar usuario en el estado
            const user = state.user;
            if (!user) {
              console.error('❌ No user found in state');
              return;
            }
            
            const updatedUser = transformSupabaseUserToAppUser(
              { id: user.id, email: user.email }, 
              newUserData
            );
            
            dispatch({ type: 'SET_USER', payload: updatedUser });
            
            // Recargar tiendas para aplicar nuevos límites
            try {
              await loadUserStores(user.id);
              console.log('✅ Stores reloaded with new plan limits');
            } catch (error) {
              console.error('❌ Error reloading stores:', error);
            }
            
            // Obtener nombre del plan dinámicamente
            const newPlan = state.plans.find(p => p.id === newUserData.plan);
            const planDisplayName = newPlan?.name || newUserData.plan;
            
            // Crear notificación personalizada si no hay sistema de toast
            const notification = document.createElement('div');
            notification.innerHTML = `
              <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10B981;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 9999;
                font-family: system-ui, -apple-system, sans-serif;
                font-weight: 500;
                max-width: 400px;
              ">
                🎉 ¡Plan Actualizado!<br>
                <span style="font-weight: 400; opacity: 0.9;">
                  Tu plan ha sido actualizado a ${planDisplayName}
                </span>
              </div>
            `;
            
            document.body.appendChild(notification);
            
            // Remover notificación después de 5 segundos
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 5000);
          }
          
          // Verificar si el estado de suscripción cambió
          if (newUserData.subscription_status !== oldUserData.subscription_status) {
            console.log(`📊 Subscription status changed from ${oldUserData.subscription_status} to ${newUserData.subscription_status}`);
            
            const updatedUser = transformSupabaseUserToAppUser(
              { id: state.user.id, email: state.user.email }, 
              newUserData
            );
            
            dispatch({ type: 'SET_USER', payload: updatedUser });
          }
        })
        .subscribe((status) => {
          console.log('📡 Real-time subscription status:', status);
        });

      return () => {
        console.log('🔌 Cleaning up real-time plan change listener');
        supabase.removeChannel(channel);
      };
    }
  }, [state.user?.id, state.isInitialized]);

  // Listener para cambios en la tabla de planes
  useEffect(() => {
    if (state.isInitialized) {
      console.log('🔄 Setting up real-time plans change listener');
      
      const channel = supabase
        .channel('plans-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'plans'
        }, async (payload) => {
          console.log('🔄 Plans updated from super admin:', payload);
          
          // Recargar planes cuando cambien
          await loadPlans();
          
          console.log('✅ Plans reloaded after change');
        })
        .subscribe((status) => {
          console.log('📡 Plans real-time subscription status:', status);
        });

      return () => {
        console.log('🔌 Cleaning up real-time plans change listener');
        supabase.removeChannel(channel);
      };
    }
  }, [state.isInitialized]);

  // NUEVO: Forzar recarga de datos de usuario periódicamente
  useEffect(() => {
    if (state.user?.id && state.isInitialized) {
      // Función para recargar datos del usuario
      const reloadUserData = async () => {
        try {
          console.log('🔄 Reloading user data to ensure plan synchronization...');
          
          // Obtener datos actualizados del usuario
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', state.user!.id)
            .single();
            
          if (userError) {
            console.error('❌ Error reloading user data:', userError);
            return;
          }
          
          if (userData) {
            // Verificar si hay cambios en el plan o estado de suscripción
            if (userData.plan !== state.user!.plan || 
                userData.subscription_status !== state.user!.subscriptionStatus) {
              
              console.log('🔄 User data changed, updating state:', {
                oldPlan: state.user!.plan,
                newPlan: userData.plan,
                oldStatus: state.user!.subscriptionStatus,
                newStatus: userData.subscription_status
              });
              
              // Verificar si el plan del usuario es válido
              const userPlanIsValid = state.plans.some(p => p.id === userData.plan);
              
              // Si el plan no es válido, asignar el plan gratuito
              if (!userPlanIsValid) {
                console.log('⚠️ User has invalid plan, updating to free plan');
                
                const freePlan = getFreePlan();
                if (freePlan) {
                  // Actualizar el plan del usuario en la base de datos
                  await supabase
                    .from('users')
                    .update({ plan: freePlan.id })
                    .eq('id', state.user!.id);
                  
                  // Actualizar el plan en userData para el estado local
                  userData.plan = freePlan.id;
                }
              }
              
              // Actualizar usuario en el estado
              const updatedUser = transformSupabaseUserToAppUser(
                { id: state.user!.id, email: state.user!.email }, 
                userData
              );
              
              dispatch({ type: 'SET_USER', payload: updatedUser });
              
              // Recargar planes y tiendas para asegurar consistencia
              await loadPlans();
              await loadUserStores(state.user!.id);
              
              console.log('✅ User data and stores reloaded successfully');
            }
          }
        } catch (error) {
          console.error('❌ Error in periodic user data reload:', error);
        }
      };
      
      // Recargar inmediatamente al montar
      reloadUserData();
      
      // Configurar intervalo para recargar cada 60 segundos
      const interval = setInterval(reloadUserData, 60000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [state.user?.id, state.isInitialized]);
  
  // NUEVO: Saber si el usuario excede el límite de tiendas activas
  const hasStoreLimitExceeded = React.useMemo(() => {
    if (!state.user) return false;
    const maxStores = getMaxLimitForUser(state.user, 'stores');
    const activeStores = state.stores.filter(store => store.status === 'active');
    return activeStores.length > maxStores;
  }, [state.user, state.stores]);

  // NUEVO: Función para suspender tiendas por id
  const suspendStores = async (storeIds: string[]) => {
    if (!state.user) return;
    if (!storeIds.length) return;
    await supabase
      .from('stores')
      .update({ status: 'suspended' as 'suspended' })
      .in('id', storeIds);
    // Actualizar estado local
    const updatedStores = state.stores.map(store =>
      storeIds.includes(store.id) ? { ...store, status: 'suspended' as 'suspended' } : store
    );
    dispatch({ type: 'SET_STORES', payload: updatedStores });
  };

  // Función para reactivar una tienda
  const reactivateStore = async (storeId: string): Promise<void> => {
    const user = state.user;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar si reactivar esta tienda excedería el límite
    const maxStores = getMaxLimitForUser(user, 'stores');
    const activeStores = state.stores.filter(store => 
      store.status === 'active' && store.id !== storeId
    );

    if (activeStores.length >= maxStores) {
      throw new Error(`No puedes reactivar esta tienda porque excederías el límite de ${maxStores} tiendas activas de tu plan.`);
    }

    // Actualizar en Supabase
    const { error } = await supabase
      .from('stores')
      .update({ status: 'active' })
      .eq('id', storeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error reactivating store:', error);
      throw new Error('No se pudo reactivar la tienda. Intenta de nuevo.');
    }

    // Actualizar estado local
    dispatch({ type: 'REACTIVATE_STORE', payload: storeId });
  };

  return (
    <StoreContext.Provider value={{ 
      state, 
      dispatch, 
      login, 
      register, 
      logout,
      createStore,
      updateStore,
      createCategory,
      updateCategory,
      deleteCategory,
      createProduct,
      updateProduct,
      deleteProduct,
      // Funciones dinámicas de planes
      loadPlans,
      getFreePlan,
      getUserPlan,
      getPlanByLevel,
      getMaxLimitForUser,
      canCreateStore,
      getMaxStores,
      getMaxProducts,
      getMaxCategories,
      hasStoreLimitExceeded,
      suspendStores,
      reactivateStore
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
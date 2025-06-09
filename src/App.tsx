import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ui/ToastContainer';

// Auth Components
import LoginPage from './components/auth/LoginPage';

// Admin Components
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './components/dashboard/Dashboard';
import ProductList from './components/products/ProductList';
import CategoryManager from './components/categories/CategoryManager';
import GeneralSettings from './components/settings/GeneralSettings';
import ThemeCustomizer from './components/design/ThemeCustomizer';
import PaymentsShipping from './components/payments/PaymentsShipping';
import AddStore from './components/premium/AddStore';
import StoreManager from './components/stores/StoreManager';

// Profile Components
import ProfilePage from './components/profile/ProfilePage';

// Subscription Components
import SubscriptionPage from './components/subscription/SubscriptionPage';

// Public Components
import PublicCatalog from './components/catalog/PublicCatalog';

// 🔥 SIMPLIFIED: Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando aplicación...</p>
      </div>
    </div>
  );
}

// 🔥 CRITICAL FIX: ProtectedRoute component with better error handling
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  
  // Show loading while initializing
  if (!state.isInitialized) {
    return <LoadingScreen />;
  }
  
  // Show error if there's an auth error
  if (state.authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de Autenticación</h2>
          <p className="text-gray-600 mb-4">{state.authError}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated, render content
  return <>{children}</>;
}

function AppRoutes() {
  const { state } = useStore();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  
  // 🎨 Handle dark mode for admin routes only
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin') || 
                        location.pathname === '/profile' || 
                        location.pathname === '/subscription';
    
    const isPublicRoute = location.pathname.startsWith('/store/') || 
                         location.pathname === '/login';
    
    // Force light mode for public routes
    if (isPublicRoute) {
      document.documentElement.classList.remove('admin-dark');
      document.body.classList.remove('admin-dark');
    }
    // Apply user preference only for admin routes
    else if (isAdminRoute) {
      if (isDarkMode) {
        document.documentElement.classList.add('admin-dark');
        document.body.classList.add('admin-dark');
      } else {
        document.documentElement.classList.remove('admin-dark');
        document.body.classList.remove('admin-dark');
      }
    }
    // Clean up for any other route
    else {
      document.documentElement.classList.remove('admin-dark');
      document.body.classList.remove('admin-dark');
    }
  }, [location.pathname, isDarkMode]);
  
  return (
    <Routes> 
      {/* 🌍 PUBLIC ROUTES - NO AUTHENTICATION REQUIRED */}
      <Route path="/store/:slug" element={<PublicCatalog />} />
      
      {/* 🔐 AUTH ROUTES */}
      <Route 
        path="/login" 
        element={
          // If already authenticated, redirect to admin
          state.isInitialized && state.isAuthenticated ? (
            <Navigate to="/admin" replace />
          ) : (
            <LoginPage />
          )
        } 
      />
      
      {/* 🛡️ PROTECTED ADMIN ROUTES */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="settings" element={<GeneralSettings />} />
        <Route path="design" element={<ThemeCustomizer />} />
        <Route path="payments-shipping" element={<PaymentsShipping />} />
        <Route path="add-store" element={<AddStore />} />
        <Route path="stores" element={<StoreManager />} />
      </Route>
      
      {/* 🛡️ PROTECTED PROFILE ROUTE */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <AdminLayout>
            <ProfilePage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* 🛡️ PROTECTED SUBSCRIPTION ROUTE */}
      <Route path="/subscription" element={
        <ProtectedRoute>
          <SubscriptionPage />
        </ProtectedRoute>
      } />
      
      {/* 🏠 DEFAULT REDIRECTS */}
      <Route 
        path="/" 
        element={
          // Only redirect if initialized
          state.isInitialized ? (
            <Navigate to={state.isAuthenticated ? "/admin" : "/login"} replace />
          ) : (
            <LoadingScreen />
          )
        } 
      />
      
      {/* 🚫 CATCH ALL ROUTE */}
      <Route 
        path="*" 
        element={
          state.isInitialized ? (
            <Navigate to={state.isAuthenticated ? "/admin" : "/login"} replace />
          ) : (
            <LoadingScreen />
          )
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <StoreProvider>
      <AnalyticsProvider>
        <ThemeProvider>
          <ToastProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <AppRoutes />
                <ToastContainer />
              </div>
            </Router>
          </ToastProvider>
        </ThemeProvider>
      </AnalyticsProvider>
    </StoreProvider>
  );
}

export default App;
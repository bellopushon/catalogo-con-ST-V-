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

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}

// ✅ CRITICAL: ProtectedRoute that correctly verifies state
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  
  console.log('🔒 ProtectedRoute - Current state:', {
    isAuthenticated: state.isAuthenticated,
    user: state.user?.email,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized
  });
  
  // Show loading while initializing
  if (!state.isInitialized) {
    console.log('⏳ Still initializing, showing loading screen');
    return <LoadingScreen />;
  }
  
  // If not authenticated, redirect to login
  if (!state.isAuthenticated) {
    console.log('❌ User not authenticated, redirecting to login');
    return <Navigate to="/login\" replace />;
  }
  
  console.log('✅ User is authenticated, rendering protected content');
  return <>{children}</>;
}

function AppRoutes() {
  const { state } = useStore();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  
  console.log('🚀 AppRoutes - Current state:', {
    isAuthenticated: state.isAuthenticated,
    user: state.user?.email,
    pathname: location.pathname,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized
  });
  
  // Handle dark mode for admin routes only
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
  
  // Show loading screen while initializing
  if (!state.isInitialized) {
    console.log('⏳ App not initialized, showing loading screen');
    return <LoadingScreen />;
  }
  
  return (
    <Routes> 
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          state.isAuthenticated ? (
            <Navigate to="/admin\" replace />
          ) : (
            <LoginPage />
          )
        } 
      />
      <Route path="/store/:slug" element={<PublicCatalog />} />
      
      {/* Protected Admin Routes */}
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
      
      {/* Protected Profile Route */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <AdminLayout>
            <ProfilePage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Protected Subscription Route */}
      <Route path="/subscription" element={
        <ProtectedRoute>
          <SubscriptionPage />
        </ProtectedRoute>
      } />
      
      {/* Default redirects */}
      <Route 
        path="/" 
        element={
          state.isAuthenticated ? (
            <Navigate to="/admin\" replace />
          ) : (
            <Navigate to="/login" replace />
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

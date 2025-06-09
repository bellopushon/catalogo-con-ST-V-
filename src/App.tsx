import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ui/ToastContainer';

import LoginPage from './components/auth/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './components/dashboard/Dashboard';
import ProductList from './components/products/ProductList';
import CategoryManager from './components/categories/CategoryManager';
import GeneralSettings from './components/settings/GeneralSettings';
import ThemeCustomizer from './components/design/ThemeCustomizer';
import PaymentsShipping from './components/payments/PaymentsShipping';
import AddStore from './components/premium/AddStore';
import StoreManager from './components/stores/StoreManager';
import ProfilePage from './components/profile/ProfilePage';
import SubscriptionPage from './components/subscription/SubscriptionPage';
import PublicCatalog from './components/catalog/PublicCatalog';

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useStore();

  // Mostrar cargando mientras se inicializa
  if (!state.isInitialized) {
    return <LoadingScreen />;
  }

  // Mostrar error si hay un error de autenticación
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

  // Si el usuario no está autenticado, redirigir al login
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { state } = useStore(); // Asegúrate de que esta función esté correctamente importada
  const { isDarkMode } = useTheme();
  const location = useLocation();

  // Esperar hasta que el estado esté completamente inicializado
  if (!state.isInitialized) {
    return <LoadingScreen />; // Si no está inicializado, mostrar la pantalla de carga
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/store/:slug" element={<PublicCatalog />} />
      
      {/* Login route */}
      <Route path="/login" element={
        // Redirigir solo si ya está autenticado y la inicialización ha terminado
        state.isAuthenticated ? (
          <Navigate to="/admin" replace />
        ) : (
          <LoginPage />
        )
      } />

      {/* Admin routes (protected) */}
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

      {/* Profile route (protected) */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <AdminLayout>
            <ProfilePage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      {/* Subscription route (protected) */}
      <Route path="/subscription" element={
        <ProtectedRoute>
          <SubscriptionPage />
        </ProtectedRoute>
      } />

      {/* Default redirect based on authentication */}
      <Route
        path="/"
        element={
          // Solo redirigir si ya se ha inicializado el estado
          state.isAuthenticated ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all route for non-matching paths */}
      <Route path="*" element={
        // Si la app no está inicializada, muestra la pantalla de carga
        state.isAuthenticated ? (
          <Navigate to="/admin" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
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

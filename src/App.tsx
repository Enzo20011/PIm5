import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Toaster } from 'react-hot-toast';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Checkout } from './pages/Checkout';
import { Profile } from './pages/Profile';
import { ProductDetail } from './pages/ProductDetail';
import { Orders } from './pages/Orders';

// El panel admin arrastra recharts (pesado): se descarga solo cuando entra un admin
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="bottom-right" toastOptions={{ className: 'dark:bg-gray-800 dark:text-white' }} />
          <Navbar />
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* Rutas para usuarios logueados */}
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Rutas Protegidas (Solo Admin) */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

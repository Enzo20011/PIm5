import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { FiShoppingCart, FiSun, FiMoon, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { isDark, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
              Patagonix Tech
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleDarkMode} 
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <FiSun className="w-5 h-5 text-yellow-400" /> : <FiMoon className="w-5 h-5 text-gray-300" />}
            </button>
            
            <Link to="/checkout" className="relative p-2 hover:text-blue-400 transition-colors">
              <FiShoppingCart className="w-6 h-6" />
              {items.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-3 ml-4 border-l border-gray-700 pl-4">
                <Link to="/profile" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
                  <FiUser className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">{user.displayName || 'Mi Perfil'}</span>
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="p-2 hover:text-blue-400 transition-colors" title="Panel de Control">
                    <FiSettings className="w-5 h-5" />
                  </Link>
                )}
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Cerrar Sesión">
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

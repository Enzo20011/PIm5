import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { FiArrowRight, FiShield, FiZap, FiBox } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
      toast.success('¡Bienvenido a Patagonix Tech!', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      navigate('/');
    } catch (error) {
      console.error("Login failed", error);
      toast.error('Ocurrió un error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700"
        >
          <div className="w-20 h-20 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
             <FiShield className="w-10 h-10 text-brand-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Ya has iniciado sesión</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Estás conectado como <span className="font-semibold text-brand-500">{user.email}</span></p>
          <button 
            onClick={() => navigate('/')} 
            className="group inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl transition-all font-medium shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 w-full sm:w-auto"
          >
            Volver a la tienda
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-500/10 dark:bg-brand-500/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
        
        {/* Left Side: Branding / Value Prop */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 w-full text-center lg:text-left pt-10 lg:pt-0"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
            Eleva tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-orange-500">rendimiento</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0">
            Ingresa a Patagonix y descubre la mejor selección de zapatillas y ropa deportiva para superar tus límites.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 hidden md:grid">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/40 rounded-lg text-brand-600 dark:text-brand-400 mt-1">
                <FiZap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Últimos Modelos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Las mejores marcas deportivas</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg text-orange-600 dark:text-orange-400 mt-1">
                <FiBox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Envíos Rápidos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">A todo el país sin demoras</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Login Card */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="w-full max-w-md lg:w-[480px] shrink-0"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bienvenido</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ingresa para continuar a Patagonix
              </p>
            </div>
            
            <div className="space-y-6">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="group relative w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-gray-200 dark:border-gray-600 text-base font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <FcGoogle className="h-6 w-6" />
                )}
                <span>{isLoading ? 'Conectando...' : 'Continuar con Google'}</span>
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Seguro y confiable</span>
                </div>
              </div>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                Al continuar, aceptas nuestros{' '}
                <a href="#" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">Términos de Servicio</a>
                {' '}y{' '}
                <a href="#" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">Política de Privacidad</a>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};


import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { orderService } from '../services/orderService';
import { OrderCard } from '../components/OrderCard';
import type { Order } from '../types';
import { motion } from 'framer-motion';
import { FiPackage, FiUser } from 'react-icons/fi';

const RECENT_ORDERS = 3;

export const Profile = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      orderService.getUserOrders(user.uid)
        .then(data => setOrders(data))
        .catch(err => {
          console.error(err);
          setError(`${err?.code ?? 'error'}: ${err?.message ?? 'desconocido'}`);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Tarjeta de Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex items-center space-x-6"
        >
          <div className="h-20 w-20 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 text-3xl">
            <FiUser />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.displayName || 'Usuario de Patagonix'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className="mt-2 inline-block px-3 py-1 bg-brand-50 dark:bg-gray-700 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-full uppercase tracking-wide">
              Rol: {user?.role}
            </span>
          </div>
        </motion.div>

        {/* Últimas compras */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <FiPackage className="mr-2" /> Últimas compras
            </h2>
            {orders.length > RECENT_ORDERS && (
              <Link to="/orders" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">Ver todas</Link>
            )}
          </div>

          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-xl border border-red-100 dark:border-red-900/40 text-center text-red-700 dark:text-red-400">
              <p>No pudimos cargar tus compras.</p>
              <p className="mt-2 text-sm font-mono break-words">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">Todavía no hiciste ninguna compra.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, RECENT_ORDERS).map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { orderService } from '../services/orderService';
import type { Order } from '../types';
import { motion } from 'framer-motion';
import { FiPackage, FiUser, FiClock } from 'react-icons/fi';

export const Profile = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      orderService.getUserOrders(user.uid)
        .then(data => setOrders(data))
        .catch(console.error)
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

        {/* Historial de Órdenes */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FiPackage className="mr-2" /> Mis Compras
          </h2>
          
          {orders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">Aún no has realizado ninguna compra.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  key={order.id} 
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">#{order.id}</p>
                    <p className="text-gray-900 dark:text-white font-medium flex items-center mt-1">
                      <FiClock className="mr-1 text-gray-400" /> {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-sm font-bold">
                      <span className={`px-2 py-1 rounded-md ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 text-right w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-700 pt-4 sm:pt-0 sm:pl-6">
                    <p className="text-2xl font-black text-brand-600 dark:text-brand-400">${order.total}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.items.length} artículos</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

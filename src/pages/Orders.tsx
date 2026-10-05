import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { orderService } from '../services/orderService';
import { OrderCard } from '../components/OrderCard';
import type { Order } from '../types';

export const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    orderService.getUserOrders(user.uid)
      .then(setOrders)
      .catch(err => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Mis compras</h2>
          <Link to="/" className="text-brand-600 dark:text-brand-400 hover:underline">Volver a la tienda</Link>
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-xl border border-red-100 dark:border-red-900/40 text-center text-red-700 dark:text-red-400">
            No pudimos cargar tus órdenes. Probá de nuevo en un rato.
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">Todavía no hiciste ninguna compra.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>
        )}
      </div>
    </div>
  );
};

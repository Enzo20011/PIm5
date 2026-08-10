import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { orderService } from '../services/orderService';
import type { Order } from '../types';
import { Link } from 'react-router-dom';

export const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const data = await orderService.getUserOrders(user!.uid);
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">Cargando tus órdenes...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Historial de Órdenes</h2>
          <Link to="/" className="text-brand-600 hover:underline">Volver a la tienda</Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500">Aún no has realizado ninguna compra.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <p className="text-sm text-gray-500">Orden ID: {order.id}</p>
                  <p className="text-sm text-gray-500">Fecha: {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="mt-2 font-medium">Estado: <span className="uppercase text-brand-600">{order.status}</span></p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="text-2xl font-bold text-gray-900">${order.total}</p>
                  <p className="text-sm text-gray-500">{order.items.length} artículo(s)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

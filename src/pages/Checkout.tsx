import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useState } from 'react';

export const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      alert("Debes iniciar sesión para comprar");
      navigate('/login');
      return;
    }
    
    setIsProcessing(true);
    try {
      await orderService.createOrder({
        userId: user.uid,
        items,
        total,
        status: 'pending'
      });
      alert("¡Orden generada con éxito!");
      clearCart();
      navigate('/orders');
    } catch (error) {
      console.error(error);
      alert("Hubo un error procesando tu orden.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Tu carrito está vacío</h2>
        <Link to="/" className="text-brand-600 hover:underline">Volver a la tienda</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Resumen de Compra</h2>
        
        <div className="space-y-4 mb-8">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-4">
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded" />
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold">${item.price * item.quantity}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center border-t pt-6 mb-8">
          <span className="text-xl font-bold text-gray-900">Total a pagar:</span>
          <span className="text-3xl font-black text-brand-600">${total}</span>
        </div>

        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-500 transition shadow-md disabled:opacity-50"
        >
          {isProcessing ? 'Procesando...' : 'Confirmar y Pagar'}
        </button>
      </div>
    </div>
  );
};

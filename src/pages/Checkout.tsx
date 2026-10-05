import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import toast from 'react-hot-toast';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';

export const Checkout = () => {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para comprar");
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    try {
      // Pago simulado: la orden y el descuento de stock se hacen en una transacción
      await orderService.placeOrder(user.uid, items.map(i => ({ id: i.id, quantity: i.quantity })));

      toast.success("¡Orden generada con éxito!");
      clearCart();
      navigate('/orders');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Hubo un error procesando tu orden.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Tu carrito está vacío</h2>
        <Link to="/" className="text-brand-600 dark:text-brand-400 hover:underline">Volver a la tienda</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Resumen de Compra</h2>

        <div className="space-y-4 mb-8">
          {items.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="flex items-center space-x-4">
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">${item.price} c/u</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label={`Quitar una unidad de ${item.name}`}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                  >
                    <FiMinus />
                  </button>
                  <span className="w-8 text-center text-gray-900 dark:text-white" data-testid={`qty-${item.id}`}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                    aria-label={`Agregar una unidad de ${item.name}`}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiPlus />
                  </button>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white w-20 text-right">${item.price * item.quantity}</p>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Eliminar ${item.name} del carrito`}
                  className="p-2 text-red-500 hover:text-red-400"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-6 mb-8">
          <span className="text-xl font-bold text-gray-900 dark:text-white">Total a pagar:</span>
          <span className="text-3xl font-black text-brand-600 dark:text-brand-400">${total}</span>
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

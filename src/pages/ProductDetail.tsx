import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import type { Product } from '../types';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiShoppingCart } from 'react-icons/fi';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      productService.getProductById(id).then(data => {
        setProduct(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Producto no encontrado</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-brand-500 hover:underline">Volver a la tienda</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
        >
          <FiArrowLeft className="mr-2" /> Volver
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Imagen del Producto */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-96 md:h-full bg-gray-100 dark:bg-gray-700 relative"
            >
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-full text-sm font-bold text-gray-800 dark:text-gray-200 shadow-sm backdrop-blur-sm">
                {product.category}
              </div>
            </motion.div>

            {/* Detalles del Producto */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 md:p-12 flex flex-col justify-center"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{product.name}</h1>
              
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-yellow-400 text-lg">{'★'.repeat(product.rating || 5)}{'☆'.repeat(5 - (product.rating || 5))}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">({product.reviewsCount || Math.floor(Math.random() * 50) + 1} reviews)</span>
              </div>
              
              <p className="text-3xl font-black text-brand-600 dark:text-brand-400 mb-6">${product.price}</p>
              
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8">
                {product.description || "Este producto no tiene una descripción detallada, pero te aseguramos que cuenta con la mejor calidad garantizada por Patagonix Tech."}
              </p>

              <div className="mt-auto">
                <button 
                  onClick={() => addItem(product)}
                  className="w-full flex items-center justify-center bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-brand-500/30"
                >
                  <FiShoppingCart className="mr-2 h-6 w-6" /> Añadir al Carrito
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

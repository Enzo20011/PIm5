import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { motion } from 'framer-motion';

export const Home = () => {
  const { user, logout } = useAuth();
  const { addItem, items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    productService.getAllCategories().then(cats => setCategories(['All', ...cats])).catch(console.error);
  }, []);

  useEffect(() => {
    loadProducts(categoryFilter);
  }, [categoryFilter]);

  const loadProducts = async (category: string) => {
    setLoading(true);
    try {
      const { products: fetched, lastDoc: fetchedLastDoc } = await productService.getProducts(8, undefined, category);
      setProducts(fetched);
      setLastDoc(fetchedLastDoc);
      setHasMore(fetched.length === 8);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    if (!lastDoc) return;
    setLoadingMore(true);
    try {
      const { products: fetched, lastDoc: fetchedLastDoc } = await productService.getProducts(8, lastDoc, categoryFilter);
      setProducts(prev => [...prev, ...fetched]);
      setLastDoc(fetchedLastDoc);
      setHasMore(fetched.length === 8);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  // La categoría ya viene filtrada por Firestore; la búsqueda por nombre queda en memoria
  // sobre lo ya cargado (con debounce para no recalcular en cada tecla).
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Filtros */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-brand-500 focus:border-brand-500"
          />
          <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === cat ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catálogo */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No se encontraron productos.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p, i) => (
              <motion.div 
                key={p.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden relative cursor-pointer" onClick={() => window.location.href = `/product/${p.id}`}>
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                    {p.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-brand-500" onClick={() => window.location.href = `/product/${p.id}`}>{p.name}</h3>
                  <div className="flex items-center mt-1 space-x-1">
                    <span className="text-yellow-400 text-sm">{'★'.repeat(p.rating || 5)}{'☆'.repeat(5 - (p.rating || 5))}</span>
                    <span className="text-xs text-gray-400">({p.reviewsCount || Math.floor(Math.random() * 50) + 1} reviews)</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2">{p.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-brand-600 dark:text-brand-400">${p.price}</span>
                    <button 
                      onClick={() => addItem(p)}
                      className="bg-brand-50 dark:bg-gray-700 text-brand-600 dark:text-brand-400 hover:bg-brand-600 dark:hover:bg-brand-600 hover:text-white dark:hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Botón Cargar Más */}
        {!loading && hasMore && filteredProducts.length > 0 && searchTerm === '' && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={loadMoreProducts}
              disabled={loadingMore}
              className="bg-white text-brand-600 border border-brand-600 hover:bg-brand-50 px-8 py-3 rounded-full font-medium transition shadow-sm disabled:opacity-50"
            >
              {loadingMore ? 'Cargando...' : 'Cargar más productos'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

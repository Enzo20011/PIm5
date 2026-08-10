import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../types';
import { useDebounce } from '../hooks/useDebounce';

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
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { products: fetched, lastVisible } = await productService.getProducts(8);
      setProducts(fetched);
      setLastDoc(lastVisible);
      setHasMore(fetched.length === 8);
      
      // Extraer categorías únicas
      const uniqueCats = Array.from(new Set(fetched.map(p => p.category)));
      setCategories(['All', ...uniqueCats]);
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
      const { products: fetched, lastVisible } = await productService.getProducts(8, lastDoc);
      setProducts(prev => [...prev, ...fetched]);
      setLastDoc(lastVisible);
      setHasMore(fetched.length === 8);
      
      // Actualizar categorías
      const uniqueCats = Array.from(new Set([...products, ...fetched].map(p => p.category)));
      setCategories(['All', ...uniqueCats]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Filtrado local
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand-600">Patagonix Tech</h1>
          <nav className="space-x-4 flex items-center">
            {/* Cart Icon / Counter */}
            <Link to="/checkout" className="relative cursor-pointer mr-4 flex items-center">
              <span className="text-2xl hover:scale-110 transition-transform">🛒</span>
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {items.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-4 ml-4">
                <span className="text-sm text-gray-600">Hola, {user.displayName || user.email}</span>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm text-brand-600 font-medium hover:text-brand-700">Panel Admin</Link>
                )}
                <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Salir</button>
              </div>
            ) : (
              <Link to="/login" className="ml-4 bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 transition">Iniciar Sesión</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Filtros */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          />
          <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === cat ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
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
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-200 overflow-hidden relative">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700 shadow-sm">
                    {p.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">{p.name}</h3>
                  <div className="flex items-center mt-1 space-x-1">
                    <span className="text-yellow-400 text-sm">{'★'.repeat(p.rating || 5)}{'☆'.repeat(5 - (p.rating || 5))}</span>
                    <span className="text-xs text-gray-400">({p.reviewsCount || Math.floor(Math.random() * 50) + 1} reviews)</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-2">{p.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-brand-600">${p.price}</span>
                    <button 
                      onClick={() => addItem(p)}
                      className="bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botón Cargar Más */}
        {!loading && hasMore && filteredProducts.length > 0 && categoryFilter === 'All' && searchTerm === '' && (
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

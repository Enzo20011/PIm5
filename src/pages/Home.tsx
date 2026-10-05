import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { motion } from 'framer-motion';

const PAGE_SIZE = 8;

export const Home = () => {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  const isSearching = debouncedSearch.trim() !== '';

  useEffect(() => {
    productService.getAllCategories().then(cats => setCategories(['All', ...cats])).catch(console.error);
  }, []);

  // Cada vez que cambia la categoría o el texto (ya con debounce) se vuelve a consultar.
  // Sin texto: catálogo paginado. Con texto: se busca en todo el catálogo, no solo en lo ya cargado.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const load = async () => {
      try {
        if (isSearching) {
          const found = await productService.searchProducts(debouncedSearch, categoryFilter);
          if (cancelled) return;
          setProducts(found);
          setLastDoc(null);
          setHasMore(false);
        } else {
          const { products: fetched, lastDoc: fetchedLastDoc } = await productService.getProducts(PAGE_SIZE, undefined, categoryFilter);
          if (cancelled) return;
          setProducts(fetched);
          setLastDoc(fetchedLastDoc);
          setHasMore(fetched.length === PAGE_SIZE);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => { cancelled = true; };
  }, [categoryFilter, debouncedSearch, isSearching]);

  const loadMoreProducts = async () => {
    if (!lastDoc) return;
    setLoadingMore(true);
    try {
      const { products: fetched, lastDoc: fetchedLastDoc } = await productService.getProducts(PAGE_SIZE, lastDoc, categoryFilter);
      setProducts(prev => [...prev, ...fetched]);
      setLastDoc(fetchedLastDoc);
      setHasMore(fetched.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Filtros */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <input
            type="text"
            placeholder="Buscar productos..."
            aria-label="Buscar productos por nombre"
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
        ) : error ? (
          <div className="text-center py-20 text-red-600 dark:text-red-400">
            No pudimos cargar los productos. Probá de nuevo en un rato.
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            No se encontraron productos.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Link y no window.location: así no se recarga la página y el carrito no se pierde */}
                <Link to={`/product/${p.id}`} className="block h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                    {p.category}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/product/${p.id}`} className="block font-medium text-gray-900 dark:text-white truncate hover:text-brand-500">
                    {p.name}
                  </Link>
                  {p.rating ? (
                    <div className="flex items-center mt-1 space-x-1">
                      <span className="text-yellow-400 text-sm">{'★'.repeat(p.rating)}{'☆'.repeat(5 - p.rating)}</span>
                      {p.reviewsCount ? <span className="text-xs text-gray-400">({p.reviewsCount} reviews)</span> : null}
                    </div>
                  ) : null}
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2">{p.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-brand-600 dark:text-brand-400">${p.price}</span>
                    <button
                      onClick={() => addItem(p)}
                      disabled={p.stock < 1}
                      className="bg-brand-50 dark:bg-gray-700 text-brand-600 dark:text-brand-400 hover:bg-brand-600 dark:hover:bg-brand-600 hover:text-white dark:hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-50 dark:disabled:hover:bg-gray-700 disabled:hover:text-brand-600"
                    >
                      {p.stock < 1 ? 'Sin stock' : '+ Agregar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Botón Cargar Más */}
        {!loading && !error && hasMore && products.length > 0 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={loadMoreProducts}
              disabled={loadingMore}
              className="bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 border border-brand-600 hover:bg-brand-50 dark:hover:bg-gray-700 px-8 py-3 rounded-full font-medium transition shadow-sm disabled:opacity-50"
            >
              {loadingMore ? 'Cargando...' : 'Cargar más productos'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

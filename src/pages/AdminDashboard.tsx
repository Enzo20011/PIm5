import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import type { Product, Order } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders'>('analytics');
  
  // Productos State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Órdenes State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('10');
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'orders' || activeTab === 'analytics') loadAdminOrders();
  }, [activeTab]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { products: fetched } = await productService.getProducts(50);
      setProducts(fetched);
    } catch (error) {
      console.error('Error cargando productos', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminOrders = async () => {
    setLoadingOrders(true);
    try {
      const fetched = await orderService.getAdminOrders();
      setOrders(fetched);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      loadAdminOrders();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar producto?')) {
      await productService.deleteProduct(id);
      toast.success('Producto eliminado');
      loadProducts();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setDescription(product.description);
    setCategory(product.category);
    setStock(product.stock?.toString() || '10');
    setFile(null); // Obligamos a mantener la imagen anterior o subir una nueva
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category) return toast.error('Faltan campos obligatorios');
    setIsCreating(true);

    try {
      let imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'; // Fallback Placeholder

      if (file) {
        console.log("Subiendo archivo a S3 de forma nativa...");
        const s3Client = new S3Client({
          region: import.meta.env.VITE_AWS_REGION || 'sa-east-1',
          credentials: {
            accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
            secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
          }
        });

        const uniqueId = uuidv4();
        const extension = file.name.split('.').pop();
        const key = `products/${uniqueId}.${extension}`;

        const command = new PutObjectCommand({
          Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
          Key: key,
          ContentType: file.type,
        });

        // 1. Generamos la URL prefirmada
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
        
        // 2. Subimos el archivo a esa URL con PUT
        await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        // 3. Obtenemos la URL pública final
        imageUrl = `https://${import.meta.env.VITE_S3_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${key}`;
        console.log("Subida exitosa:", imageUrl);
      } else if (editingId) {
        // Mantenemos la imagen existente si estamos editando y no hay archivo nuevo
        const existingProduct = products.find(p => p.id === editingId);
        if (existingProduct) imageUrl = existingProduct.imageUrl;
      }

      const productData = {
        name,
        description,
        price: Number(price),
        category,
        imageUrl,
        stock: Number(stock)
      };

      if (editingId) {
        await productService.updateProduct(editingId, productData);
        toast.success('Producto actualizado exitosamente');
      } else {
        await productService.createProduct(productData);
        toast.success('Producto creado exitosamente');
      }

      setName(''); setPrice(''); setDescription(''); setCategory(''); setStock('10'); setFile(null); setEditingId(null);
      loadProducts();
    } catch (error: any) {
      console.error(error);
      toast.error(`Error guardando producto: ${error?.message || 'Error desconocido'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar - Diferenciado para el Admin */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 hidden md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-brand-500">Patagonix Admin</h1>
          <p className="text-sm text-gray-400 mt-2">Panel de Control</p>
        </div>
        <nav className="mt-6">
          <button onClick={() => setActiveTab('analytics')} className={`w-full text-left block px-6 py-3 ${activeTab === 'analytics' ? 'bg-gray-900 text-white border-l-4 border-brand-500' : 'text-gray-400 hover:text-white hover:bg-gray-700 transition'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('products')} className={`w-full text-left block px-6 py-3 ${activeTab === 'products' ? 'bg-gray-900 text-white border-l-4 border-brand-500' : 'text-gray-400 hover:text-white hover:bg-gray-700 transition'}`}>Productos</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full text-left block px-6 py-3 ${activeTab === 'orders' ? 'bg-gray-900 text-white border-l-4 border-brand-500' : 'text-gray-400 hover:text-white hover:bg-gray-700 transition'}`}>Órdenes</button>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {activeTab === 'analytics' ? (
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6">Métricas de Ventas</h2>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg mb-8">
                <div className="grid grid-cols-3 gap-6 mb-8 text-center">
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Órdenes Totales</p>
                    <p className="text-3xl font-bold text-white">{orders.length}</p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Ingresos Totales</p>
                    <p className="text-3xl font-bold text-brand-500">${orders.reduce((sum, o) => sum + o.total, 0)}</p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Promedio por Orden</p>
                    <p className="text-3xl font-bold text-white">${orders.length ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0}</p>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={orders.map((o, i) => ({ name: `Orden ${orders.length - i}`, ventas: o.total })).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                      <Line type="monotone" dataKey="ventas" stroke="#22c55e" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : activeTab === 'products' ? (
            <div className="max-w-5xl mx-auto space-y-8">
              
              <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">{editingId ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h2>
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del producto" className="bg-gray-700 border-gray-600 rounded p-2 text-white w-full focus:ring-brand-500" required />
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="Precio ($)" className="bg-gray-700 border-gray-600 rounded p-2 text-white w-full focus:ring-brand-500" required />
                <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Categoría" className="bg-gray-700 border-gray-600 rounded p-2 text-white w-full focus:ring-brand-500" required />
                <input value={stock} onChange={e => setStock(e.target.value)} type="number" placeholder="Stock" className="bg-gray-700 border-gray-600 rounded p-2 text-white w-full focus:ring-brand-500" required />
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="bg-gray-700 border-gray-600 rounded p-1.5 text-white w-full md:col-span-2" accept="image/*" />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" className="bg-gray-700 border-gray-600 rounded p-2 text-white w-full md:col-span-3 focus:ring-brand-500" rows={3}></textarea>
                <div className="md:col-span-3 flex justify-end space-x-4">
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setName(''); setPrice(''); setDescription(''); setCategory(''); setStock('10'); setFile(null); }} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded font-medium transition">
                      Cancelar
                    </button>
                  )}
                  <button disabled={isCreating} type="submit" className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded font-medium disabled:opacity-50 transition">
                    {isCreating ? 'Guardando...' : (editingId ? 'Actualizar Producto' : 'Crear Producto')}
                  </button>
                </div>
              </form>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Catálogo Actual</h2>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center text-gray-400">
                  No hay productos en el catálogo. ¡Crea el primero!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-500 transition-colors">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-48 object-cover" />
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium text-white truncate pr-2">{p.name}</h3>
                          <span className="text-brand-400 font-bold">${p.price}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{p.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">{p.category} | Stock: {p.stock || 0}</span>
                          <div className="flex space-x-3">
                            <button onClick={() => handleEdit(p)} className="text-sm text-blue-400 hover:text-blue-300" title="Editar">
                              <FiEdit2 />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="text-sm text-red-400 hover:text-red-300" title="Eliminar">
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6">Gestión de Órdenes</h2>
              {loadingOrders ? (
                <div className="text-center py-10">Cargando órdenes...</div>
              ) : orders.length === 0 ? (
                <div className="bg-gray-800 p-8 rounded-xl text-center text-gray-400">No hay órdenes registradas.</div>
              ) : (
                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900 text-gray-400">
                      <tr>
                        <th className="p-4">ID Orden</th>
                        <th className="p-4">Cliente (UID)</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-750">
                          <td className="p-4">{order.id.slice(0,8)}...</td>
                          <td className="p-4">{order.userId.slice(0,8)}...</td>
                          <td className="p-4 font-bold">${order.total}</td>
                          <td className="p-4">
                            <select 
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                              className="bg-gray-700 border border-gray-600 rounded p-1 text-white text-sm"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="processing">Procesando</option>
                              <option value="shipped">Enviado</option>
                              <option value="delivered">Entregado</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                          </td>
                          <td className="p-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
      </main>
    </div>
  );
};

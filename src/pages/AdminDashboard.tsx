import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { auth } from '../services/firebase';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '../types';
import type { Product, Order, OrderStatus } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type Tab = 'analytics' | 'products' | 'orders';
const TABS: { id: Tab; label: string }[] = [
  { id: 'analytics', label: 'Dashboard' },
  { id: 'products', label: 'Productos' },
  { id: 'orders', label: 'Órdenes' },
];

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('analytics');

  // Productos State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Órdenes State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

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
      toast.error('No se pudieron cargar los productos');
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
      toast.error('No se pudieron cargar las órdenes');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success('Estado actualizado');
      loadAdminOrders();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cambiar el estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar producto?')) return;
    try {
      await productService.deleteProduct(id);
      toast.success('Producto eliminado');
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar el producto');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName(''); setPrice(''); setDescription(''); setCategory(''); setStock('10'); setFile(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && !IMAGE_TYPES.includes(selected.type)) {
      toast.error('Solo se aceptan imágenes JPG, PNG, WEBP o GIF');
      e.target.value = '';
      return setFile(null);
    }
    if (selected && selected.size > MAX_IMAGE_SIZE) {
      toast.error('La imagen no puede pesar más de 5 MB');
      e.target.value = '';
      return setFile(null);
    }
    setFile(selected);
  };

  const uploadImage = async (image: File): Promise<string> => {
    // 1. Pedimos una URL prefirmada a la función serverless (las credenciales de AWS quedan en el servidor).
    //    La función verifica con el token de Firebase que quien pide sea admin.
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Tu sesión expiró, volvé a iniciar sesión');

    const presignRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ filename: image.name, filetype: image.type, size: image.size })
    });
    if (!presignRes.ok) {
      const body = await presignRes.json().catch(() => null);
      throw new Error(body?.message || 'No se pudo generar la URL de subida');
    }
    const { url: presignedUrl, publicUrl } = await presignRes.json();

    // 2. Subimos el archivo directamente a S3 con esa URL
    const putRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: image,
      headers: { 'Content-Type': image.type }
    });
    if (!putRes.ok) throw new Error('S3 rechazó la subida de la imagen');

    // 3. Devolvemos la URL pública final
    return publicUrl;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNumber = Number(price);
    const stockNumber = Number(stock);
    if (!name.trim() || !category.trim()) return toast.error('Faltan campos obligatorios');
    if (!(priceNumber > 0)) return toast.error('El precio tiene que ser mayor a 0');
    if (!Number.isInteger(stockNumber) || stockNumber < 0) return toast.error('El stock tiene que ser un entero de 0 o más');
    setIsCreating(true);

    try {
      let imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'; // Fallback Placeholder

      if (file) {
        imageUrl = await uploadImage(file);
      } else if (editingId) {
        // Mantenemos la imagen existente si estamos editando y no hay archivo nuevo
        const existingProduct = products.find(p => p.id === editingId);
        if (existingProduct) imageUrl = existingProduct.imageUrl;
      }

      const productData = {
        name: name.trim(),
        description,
        price: priceNumber,
        category: category.trim(),
        imageUrl,
        stock: stockNumber
      };

      if (editingId) {
        await productService.updateProduct(editingId, productData);
        toast.success('Producto actualizado exitosamente');
      } else {
        await productService.createProduct(productData);
        toast.success('Producto creado exitosamente');
      }

      resetForm();
      loadProducts();
    } catch (error: any) {
      console.error(error);
      toast.error(`Error guardando producto: ${error?.message || 'Error desconocido'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Las canceladas no cuentan como venta
  const sales = orders.filter(o => o.status !== 'cancelled');
  const revenue = sales.reduce((sum, o) => sum + o.total, 0);
  const visibleOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  const tabClass = (id: Tab) =>
    activeTab === id
      ? 'bg-gray-900 text-white border-brand-500'
      : 'text-gray-400 hover:text-white hover:bg-gray-700 transition border-transparent';

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      {/* Sidebar (escritorio) - Diferenciado para el Admin */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 hidden md:block shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-brand-500">Patagonix Admin</h1>
          <p className="text-sm text-gray-400 mt-2">Panel de Control</p>
        </div>
        <nav className="mt-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full text-left block px-6 py-3 border-l-4 ${tabClass(t.id)}`}>{t.label}</button>
          ))}
        </nav>
      </aside>

      {/* Pestañas (celular) */}
      <nav className="md:hidden bg-gray-800 border-b border-gray-700 flex" aria-label="Secciones del panel">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 py-3 text-sm font-medium border-b-4 ${tabClass(t.id)}`}>{t.label}</button>
        ))}
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-w-0">
          {activeTab === 'analytics' ? (
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6">Métricas de Ventas</h2>
              <div className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-700 shadow-lg mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 text-center">
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Órdenes Totales</p>
                    <p className="text-3xl font-bold text-white">{orders.length}</p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Ingresos (sin canceladas)</p>
                    <p className="text-3xl font-bold text-brand-500">${revenue}</p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Promedio por Orden</p>
                    <p className="text-3xl font-bold text-white">${sales.length ? Math.round(revenue / sales.length) : 0}</p>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sales.map((o, i) => ({ name: `Orden ${sales.length - i}`, ventas: o.total })).reverse()}>
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
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del producto" aria-label="Nombre del producto" className="bg-gray-700 border-gray-600 rounded p-2 text-white w-full focus:ring-brand-500" required />
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" min="0" step="any" placeholder="Precio ($)" aria-label="Precio" className="bg-gray-700 border-gray-600 rounded p-2 text-white w-full focus:ring-brand-500" required />
                <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Categoría" aria-label="Categoría" className="bg-gray-700 border-gray-600 rounded p-2 text-white w-full focus:ring-brand-500" required />
                <input value={stock} onChange={e => setStock(e.target.value)} type="number" min="0" step="1" placeholder="Stock" aria-label="Stock" className="bg-gray-700 border-gray-600 rounded p-2 text-white w-full focus:ring-brand-500" required />
                <input type="file" onChange={handleFileChange} aria-label="Imagen del producto" className="bg-gray-700 border-gray-600 rounded p-1.5 text-white w-full md:col-span-2" accept={IMAGE_TYPES.join(',')} />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" aria-label="Descripción" className="bg-gray-700 border-gray-600 rounded p-2 text-white w-full md:col-span-3 focus:ring-brand-500" rows={3}></textarea>
                <div className="md:col-span-3 flex justify-end space-x-4">
                  {editingId && (
                    <button type="button" onClick={resetForm} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded font-medium transition">
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
                            <button onClick={() => handleEdit(p)} className="text-sm text-blue-400 hover:text-blue-300" title="Editar" aria-label={`Editar ${p.name}`}>
                              <FiEdit2 />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="text-sm text-red-400 hover:text-red-300" title="Eliminar" aria-label={`Eliminar ${p.name}`}>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-semibold">Gestión de Órdenes</h2>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  Filtrar por estado
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
                    className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm"
                  >
                    <option value="all">Todos</option>
                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
                  </select>
                </label>
              </div>

              {loadingOrders ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
              ) : visibleOrders.length === 0 ? (
                <div className="bg-gray-800 p-8 rounded-xl text-center text-gray-400">
                  {orders.length === 0 ? 'No hay órdenes registradas.' : 'No hay órdenes con ese estado.'}
                </div>
              ) : (
                <div className="bg-gray-800 rounded-xl overflow-x-auto border border-gray-700">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900 text-gray-400">
                      <tr>
                        <th className="p-4">ID Orden</th>
                        <th className="p-4">Cliente (UID)</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Fecha</th>
                        <th className="p-4"><span className="sr-only">Detalle</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {visibleOrders.map(order => (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-gray-750">
                            <td className="p-4">{order.id.slice(0,8)}...</td>
                            <td className="p-4">{order.userId.slice(0,8)}...</td>
                            <td className="p-4 font-bold">${order.total}</td>
                            <td className="p-4">
                              <select
                                value={ORDER_STATUSES.includes(order.status) ? order.status : ''}
                                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                aria-label={`Estado de la orden ${order.id}`}
                                className="bg-gray-700 border border-gray-600 rounded p-1 text-white text-sm"
                              >
                                {!ORDER_STATUSES.includes(order.status) && (
                                  <option value="" disabled>{ORDER_STATUS_LABELS[order.status] ?? order.status}</option>
                                )}
                                {ORDER_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
                              </select>
                            </td>
                            <td className="p-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="p-4">
                              <button
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                aria-expanded={expandedOrder === order.id}
                                className="text-brand-400 hover:text-brand-300 whitespace-nowrap"
                              >
                                {expandedOrder === order.id ? 'Ocultar' : 'Ver detalle'}
                              </button>
                            </td>
                          </tr>
                          {expandedOrder === order.id && (
                            <tr className="bg-gray-900/60">
                              <td colSpan={6} className="p-4">
                                <ul className="space-y-2">
                                  {(order.items ?? []).map(it => (
                                    <li key={it.id} className="flex justify-between gap-4 text-gray-300">
                                      <span>{it.name}</span>
                                      <span className="whitespace-nowrap">{it.quantity} x ${it.price} = ${it.quantity * it.price}</span>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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

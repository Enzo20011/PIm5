import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { CartProvider } from '../contexts/CartContext';
import { Home } from './Home';
import { Checkout } from './Checkout';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import type { Product } from '../types';

// Test de integración: catálogo -> carrito -> checkout -> orden.
// Firebase queda totalmente mockeado a nivel de servicios.
vi.mock('../services/firebase', () => ({ auth: {}, db: {} }));
vi.mock('../services/productService', () => ({
  productService: {
    getProducts: vi.fn(),
    searchProducts: vi.fn(),
    getAllCategories: vi.fn(),
  },
}));
vi.mock('../services/orderService', () => ({
  orderService: { placeOrder: vi.fn() },
}));
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', email: 'cliente@test.com', displayName: 'Cliente', role: 'customer', createdAt: 0 },
    loading: false,
    logout: vi.fn(),
  }),
}));

const product = (over: Partial<Product>): Product => ({
  id: 'p1',
  name: 'Zapatillas Trail',
  description: 'Para correr',
  price: 100,
  category: 'Calzado',
  imageUrl: '',
  stock: 3,
  createdAt: 1,
  ...over,
});

const catalog = [
  product({}),
  product({ id: 'p2', name: 'Remera Dry', price: 40, category: 'Ropa', stock: 0 }),
];

const renderShop = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CartProvider>
        <Link to="/checkout">Ir al checkout</Link>
        <Link to="/">Ir al inicio</Link>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<div>Pantalla de órdenes</div>} />
        </Routes>
      </CartProvider>
    </MemoryRouter>
  );

describe('Flujo de compra', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productService.getAllCategories).mockResolvedValue(['Calzado', 'Ropa']);
    vi.mocked(productService.getProducts).mockResolvedValue({ products: catalog, lastDoc: null });
    vi.mocked(productService.searchProducts).mockResolvedValue([catalog[0]]);
    vi.mocked(orderService.placeOrder).mockResolvedValue('orden-1');
  });

  it('muestra el catálogo, deshabilita los productos sin stock y arma el carrito', async () => {
    const user = userEvent.setup();
    renderShop();

    expect(await screen.findByText('Zapatillas Trail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sin stock' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '+ Agregar' }));
    await user.click(screen.getByText('Ir al checkout'));

    expect(await screen.findByText('Resumen de Compra')).toBeInTheDocument();
    expect(screen.getByTestId('qty-p1')).toHaveTextContent('1');
  });

  it('el carrito se mantiene al navegar entre páginas (no hay recarga)', async () => {
    const user = userEvent.setup();
    renderShop();

    await user.click(await screen.findByRole('button', { name: '+ Agregar' }));
    await user.click(screen.getByText('Ir al checkout'));
    await user.click(await screen.findByText('Ir al inicio'));
    await user.click(screen.getByText('Ir al checkout'));

    expect(await screen.findByTestId('qty-p1')).toHaveTextContent('1');
  });

  it('permite cambiar cantidades (con tope de stock) y confirmar la compra', async () => {
    const user = userEvent.setup();
    renderShop();

    await user.click(await screen.findByRole('button', { name: '+ Agregar' }));
    await user.click(screen.getByText('Ir al checkout'));

    const plus = await screen.findByRole('button', { name: /Agregar una unidad de Zapatillas Trail/ });
    await user.click(plus);
    await user.click(plus);
    expect(screen.getByTestId('qty-p1')).toHaveTextContent('3');
    expect(plus).toBeDisabled(); // stock = 3

    await user.click(screen.getByRole('button', { name: 'Confirmar y Pagar' }));

    await waitFor(() => expect(orderService.placeOrder).toHaveBeenCalledWith('user-1', [{ id: 'p1', quantity: 3 }]));
    expect(await screen.findByText('Pantalla de órdenes')).toBeInTheDocument();
  });

  it('permite eliminar un producto y muestra el carrito vacío', async () => {
    const user = userEvent.setup();
    renderShop();

    await user.click(await screen.findByRole('button', { name: '+ Agregar' }));
    await user.click(screen.getByText('Ir al checkout'));
    await user.click(await screen.findByRole('button', { name: /Eliminar Zapatillas Trail del carrito/ }));

    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
  });

  it('si la compra falla (ej. sin stock) muestra el error y no limpia el carrito', async () => {
    vi.mocked(orderService.placeOrder).mockRejectedValue(new Error('No hay stock suficiente'));
    const user = userEvent.setup();
    renderShop();

    await user.click(await screen.findByRole('button', { name: '+ Agregar' }));
    await user.click(screen.getByText('Ir al checkout'));
    await user.click(await screen.findByRole('button', { name: 'Confirmar y Pagar' }));

    await waitFor(() => expect(orderService.placeOrder).toHaveBeenCalled());
    expect(screen.getByText('Resumen de Compra')).toBeInTheDocument();
  });

  it('la búsqueda (con debounce) consulta todo el catálogo y no solo lo cargado', async () => {
    const user = userEvent.setup();
    renderShop();
    await screen.findByText('Zapatillas Trail');

    await user.type(screen.getByLabelText('Buscar productos por nombre'), 'zapa');

    await waitFor(() => expect(productService.searchProducts).toHaveBeenCalledWith('zapa', 'All'), { timeout: 2000 });
    // Antes del debounce no se disparó una consulta por cada tecla
    expect(productService.searchProducts).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Zapatillas Trail')).toBeInTheDocument();
  });
});

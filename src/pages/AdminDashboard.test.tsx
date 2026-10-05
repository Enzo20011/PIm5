import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboard } from './AdminDashboard';
import { orderService } from '../services/orderService';
import type { Order } from '../types';

vi.mock('../services/firebase', () => ({ auth: { currentUser: null }, db: {} }));
vi.mock('../services/productService', () => ({
  productService: { getProducts: vi.fn().mockResolvedValue({ products: [], lastDoc: null }) },
}));
vi.mock('../services/orderService', () => ({
  orderService: { getAdminOrders: vi.fn(), updateOrderStatus: vi.fn() },
}));
// recharts necesita medir el DOM (ResizeObserver), que jsdom no tiene: se reemplaza por stubs
vi.mock('recharts', () => {
  const Stub = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Stub, LineChart: Stub, Line: Stub, XAxis: Stub, YAxis: Stub, CartesianGrid: Stub, Tooltip: Stub,
  };
});

const order = (over: Partial<Order>): Order => ({
  id: 'orden-aaaaaaaa',
  userId: 'usuario-1111',
  items: [{ id: 'p1', name: 'Zapatillas Trail', price: 100, quantity: 2, imageUrl: '' }],
  total: 200,
  status: 'pending',
  createdAt: 1700000000000,
  ...over,
});

const orders: Order[] = [
  order({ id: 'pendiente-1', status: 'pending', total: 200 }),
  order({ id: 'completada-1', status: 'completed', total: 500 }),
  order({ id: 'cancelada-1', status: 'cancelled', total: 999 }),
];

const goToOrders = async () => {
  const user = userEvent.setup();
  render(<AdminDashboard />);
  // La navegación está duplicada (barra lateral en escritorio y pestañas en celular)
  await user.click(screen.getAllByRole('button', { name: 'Órdenes' })[0]);
  await screen.findByText('Gestión de Órdenes');
  return user;
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orderService.getAdminOrders).mockResolvedValue(orders);
    vi.mocked(orderService.updateOrderStatus).mockResolvedValue();
  });

  it('el dashboard no cuenta las órdenes canceladas como ingresos', async () => {
    render(<AdminDashboard />);
    expect(await screen.findByText('$700')).toBeInTheDocument(); // 200 + 500, sin los 999 cancelados
  });

  it('lista todas las órdenes y permite filtrarlas por estado', async () => {
    const user = await goToOrders();
    expect(await screen.findAllByRole('row')).toHaveLength(4); // encabezado + 3

    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'completed');

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(within(rows[1]).getByText('$500')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando ninguna orden tiene el estado elegido', async () => {
    vi.mocked(orderService.getAdminOrders).mockResolvedValue([order({ status: 'pending' })]);
    const user = await goToOrders();
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'processing');
    expect(screen.getByText('No hay órdenes con ese estado.')).toBeInTheDocument();
  });

  it('cambia el estado de una orden', async () => {
    const user = await goToOrders();
    await user.selectOptions(screen.getByLabelText('Estado de la orden pendiente-1'), 'processing');
    expect(orderService.updateOrderStatus).toHaveBeenCalledWith('pendiente-1', 'processing');
  });

  it('muestra el detalle de los productos de una orden', async () => {
    const user = await goToOrders();
    await user.click(screen.getAllByRole('button', { name: 'Ver detalle' })[0]);
    expect(screen.getByText('Zapatillas Trail')).toBeInTheDocument();
    expect(screen.getByText('2 x $100 = $200')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runTransaction } from 'firebase/firestore';
import { orderService } from './orderService';

vi.mock('./firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ col: name })),
  // doc(db, 'products', id) -> ref por ruta; doc(collection) -> ref nueva con id generado
  doc: vi.fn((first: any, ...rest: string[]) =>
    rest.length ? { path: rest.join('/') } : { path: `${first.col}/nueva`, id: 'nueva' }
  ),
  runTransaction: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}));

const products: Record<string, { name: string; price: number; stock: number; imageUrl: string }> = {
  'products/a': { name: 'Zapatillas', price: 100, stock: 5, imageUrl: 'a.png' },
  'products/b': { name: 'Remera', price: 40, stock: 1, imageUrl: 'b.png' },
};

const fakeTx = () => ({
  get: vi.fn(async (ref: { path: string }) => ({
    exists: () => ref.path in products,
    data: () => products[ref.path],
  })),
  update: vi.fn(),
  set: vi.fn(),
});

const runWith = (tx: ReturnType<typeof fakeTx>) =>
  vi.mocked(runTransaction).mockImplementation((_db: any, fn: any) => fn(tx));

describe('orderService.placeOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea la orden pending, calcula el total con los precios de Firestore y descuenta el stock', async () => {
    const tx = fakeTx();
    runWith(tx);

    const id = await orderService.placeOrder('user-1', [
      { id: 'a', quantity: 2 },
      { id: 'b', quantity: 1 },
    ]);

    expect(id).toBe('nueva');
    expect(tx.update).toHaveBeenCalledWith({ path: 'products/a' }, { stock: 3 });
    expect(tx.update).toHaveBeenCalledWith({ path: 'products/b' }, { stock: 0 });

    const [, order] = tx.set.mock.calls[0];
    expect(order).toMatchObject({ userId: 'user-1', status: 'pending', total: 240 });
    expect(order.items).toHaveLength(2);
    expect(order.items[0]).toMatchObject({ id: 'a', name: 'Zapatillas', price: 100, quantity: 2 });
  });

  it('no escribe nada si alguna línea supera el stock disponible', async () => {
    const tx = fakeTx();
    runWith(tx);

    await expect(
      orderService.placeOrder('user-1', [
        { id: 'a', quantity: 1 },
        { id: 'b', quantity: 2 },
      ])
    ).rejects.toThrow(/stock suficiente de "Remera"/);

    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalled();
  });

  it('falla si el producto ya no existe', async () => {
    const tx = fakeTx();
    runWith(tx);
    await expect(orderService.placeOrder('user-1', [{ id: 'zzz', quantity: 1 }])).rejects.toThrow(/ya no existe/);
    expect(tx.set).not.toHaveBeenCalled();
  });

  it('falla con carrito vacío sin abrir transacción', async () => {
    await expect(orderService.placeOrder('user-1', [])).rejects.toThrow(/vacío/);
    expect(runTransaction).not.toHaveBeenCalled();
  });
});

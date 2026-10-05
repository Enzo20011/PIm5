import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDoc } from 'firebase/firestore';
import { productService } from './productService';

vi.mock('./firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((_db: unknown, ...path: string[]) => ({ path: path.join('/') })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
}));

describe('productService.getProductById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('usa el id del documento aunque el producto no lo tenga guardado como campo', async () => {
    // Sin campo "id" en los datos: antes el producto volvía con id undefined y rompía el checkout
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      id: 'doc-123',
      data: () => ({ name: 'adidas', price: 10, stock: 3 }),
    } as any);

    const product = await productService.getProductById('doc-123');
    expect(product?.id).toBe('doc-123');
    expect(product?.name).toBe('adidas');
  });

  it('devuelve null si el producto no existe', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);
    expect(await productService.getProductById('nada')).toBeNull();
  });
});

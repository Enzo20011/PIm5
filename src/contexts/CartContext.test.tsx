import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CartProvider, useCart } from './CartContext';
import type { Product } from '../types';

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'A test product',
  price: 100,
  category: 'Test',
  imageUrl: '',
  stock: 10,
  createdAt: 12345
};

const TestComponent = () => {
  const { items, total, addItem, removeItem, updateQuantity, clearCart } = useCart();
  return (
    <div>
      <span data-testid="items-length">{items.length}</span>
      <span data-testid="total">{total}</span>
      <button onClick={() => addItem(mockProduct)}>Add</button>
      <button onClick={() => removeItem(mockProduct.id)}>Remove</button>
      <button onClick={() => updateQuantity(mockProduct.id, 3)}>SetQty3</button>
      <button onClick={clearCart}>Clear</button>
    </div>
  );
};

describe('CartContext', () => {
  it('should initialize with empty cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
    expect(screen.getByTestId('items-length').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0');
  });

  it('should add item to cart and calculate total', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
    
    const addButton = screen.getByText('Add');
    act(() => {
      addButton.click();
    });

    expect(screen.getByTestId('items-length').textContent).toBe('1');
    expect(screen.getByTestId('total').textContent).toBe('100');
  });

  it('should remove item from cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );
    
    const addButton = screen.getByText('Add');
    const removeButton = screen.getByText('Remove');
    
    act(() => {
      addButton.click();
    });
    expect(screen.getByTestId('items-length').textContent).toBe('1');
    
    act(() => {
      removeButton.click();
    });
    expect(screen.getByTestId('items-length').textContent).toBe('0');
  });

  it('should update item quantity and recalculate total', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByText('Add').click();
    });
    act(() => {
      screen.getByText('SetQty3').click();
    });

    expect(screen.getByTestId('items-length').textContent).toBe('1');
    expect(screen.getByTestId('total').textContent).toBe('300');
  });

  it('should clear the cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByText('Add').click();
    });
    act(() => {
      screen.getByText('Clear').click();
    });

    expect(screen.getByTestId('items-length').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0');
  });

  it('should throw when useCart is used outside of a CartProvider', () => {
    expect(() => renderHook(() => useCart())).toThrow(
      'useCart must be used within a CartProvider'
    );
  });

  describe('límites de stock y cantidades (useCart con renderHook)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;
    const lowStock: Product = { ...mockProduct, id: '2', stock: 2 };

    it('no deja agregar más unidades que el stock', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      act(() => result.current.addItem(lowStock));
      act(() => result.current.addItem(lowStock));
      act(() => result.current.addItem(lowStock)); // tercera: no hay stock
      expect(result.current.items[0].quantity).toBe(2);
    });

    it('no agrega productos sin stock', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      act(() => result.current.addItem({ ...lowStock, stock: 0 }));
      expect(result.current.items).toHaveLength(0);
    });

    it('updateQuantity topa en el stock', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      act(() => result.current.addItem(lowStock));
      act(() => result.current.updateQuantity('2', 50));
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.total).toBe(200);
    });

    it('updateQuantity en 0 saca el producto del carrito', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      act(() => result.current.addItem(lowStock));
      act(() => result.current.updateQuantity('2', 0));
      expect(result.current.items).toHaveLength(0);
      expect(result.current.total).toBe(0);
    });
  });
});

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
});

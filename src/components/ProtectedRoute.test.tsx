import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import type { UserProfile } from '../types';

vi.mock('../hooks/useAuth');
const mockUseAuth = vi.mocked(useAuth);

const customerProfile: UserProfile = {
  uid: 'customer-1',
  email: 'cliente@test.com',
  displayName: 'Cliente Test',
  role: 'customer',
  createdAt: Date.now(),
};

const adminProfile: UserProfile = { ...customerProfile, uid: 'admin-1', role: 'admin' };

const renderProtected = (allowedRoles?: UserProfile['role'][]) =>
  render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path="/login" element={<div>Pantalla de Login</div>} />
        <Route path="/" element={<div>Home</div>} />
        <Route
          path="/private"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Contenido Privado</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  it('muestra un loader mientras se resuelve el estado de auth', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, logout: vi.fn() });
    renderProtected();
    expect(screen.queryByText('Contenido Privado')).not.toBeInTheDocument();
  });

  it('redirige a /login si no hay usuario autenticado', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    renderProtected();
    expect(screen.getByText('Pantalla de Login')).toBeInTheDocument();
  });

  it('redirige a home si el rol no está permitido', () => {
    mockUseAuth.mockReturnValue({ user: customerProfile, loading: false, logout: vi.fn() });
    renderProtected(['admin']);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renderiza el contenido si el usuario tiene el rol permitido', () => {
    mockUseAuth.mockReturnValue({ user: adminProfile, loading: false, logout: vi.fn() });
    renderProtected(['admin']);
    expect(screen.getByText('Contenido Privado')).toBeInTheDocument();
  });

  it('renderiza el contenido para cualquier usuario autenticado si no se pasan roles', () => {
    mockUseAuth.mockReturnValue({ user: customerProfile, loading: false, logout: vi.fn() });
    renderProtected();
    expect(screen.getByText('Contenido Privado')).toBeInTheDocument();
  });
});

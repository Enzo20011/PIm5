import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import type { UserProfile } from '../types';

vi.mock('../services/firebase', () => ({ auth: {} }));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
}));
vi.mock('../services/authService', () => ({
  authService: { getOrCreateUserProfile: vi.fn() },
}));

const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
const mockSignOut = vi.mocked(signOut);
const mockGetOrCreateUserProfile = vi.mocked(authService.getOrCreateUserProfile);

const adminProfile: UserProfile = {
  uid: 'admin-1',
  email: 'admin@test.com',
  displayName: 'Admin Test',
  role: 'admin',
  createdAt: Date.now(),
};

const Consumer = () => {
  const { user, loading, logout } = useAuth();
  if (loading) return <span>Cargando sesión...</span>;
  return (
    <div>
      <span>{user ? `Rol: ${user.role}` : 'Sin sesión'}</span>
      <button onClick={logout}>Salir</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado de carga y luego el perfil cuando Firebase emite un usuario', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
      callback({ uid: 'admin-1' });
      return () => {};
    });
    mockGetOrCreateUserProfile.mockResolvedValue(adminProfile);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(screen.getByText('Cargando sesión...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Rol: admin')).toBeInTheDocument());
  });

  it('termina la carga con user=null cuando no hay sesión de Firebase', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
      callback(null);
      return () => {};
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('Sin sesión')).toBeInTheDocument());
    expect(mockGetOrCreateUserProfile).not.toHaveBeenCalled();
  });

  it('logout llama a signOut de Firebase y limpia el usuario', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
      callback({ uid: 'admin-1' });
      return () => {};
    });
    mockGetOrCreateUserProfile.mockResolvedValue(adminProfile);

    const { user } = await import('@testing-library/user-event').then((m) => ({ user: m.default.setup() }));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('Rol: admin')).toBeInTheDocument());
    await user.click(screen.getByText('Salir'));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText('Sin sesión')).toBeInTheDocument());
  });
});

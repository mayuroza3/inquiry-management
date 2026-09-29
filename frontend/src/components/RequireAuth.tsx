import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import type { ComponentType, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../types';

export function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export function requireAuth<P extends object>(Component: ComponentType<P>, role?: Role) {
  return function Guarded(props: P) {
    return (
      <RequireAuth role={role}>
        <Component {...props} />
      </RequireAuth>
    );
  };
}

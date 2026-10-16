import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './auth-provider';

/** Hook de acceso al contexto de autenticación. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}

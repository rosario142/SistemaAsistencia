import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getStoredToken, ApiError } from '@/shared/api-client/client';
import { authApi } from '@/shared/api-client/endpoints';
import type { LoginRequest, RoleName, User } from '@/shared/api-client/types';

/** Clave del JWT en `localStorage`. */
export const TOKEN_STORAGE_KEY = 'sicae_token';
/** Clave del usuario cacheado en `localStorage` (para pintar la UI sin espera). */
export const USER_STORAGE_KEY = 'sicae_user';

export interface AuthContextValue {
  token: string | null;
  user: User | null;
  /** `true` mientras se valida el token con `GET /auth/me`. */
  isLoading: boolean;
  /** POST /auth/login y persiste token + usuario. Lanza `ApiError` si falla. */
  login: (credentials: LoginRequest) => Promise<User>;
  /** Limpia token y usuario de `localStorage`. */
  logout: () => void;
  /** Comprueba si el usuario autenticado tiene el rol indicado. */
  hasRole: (role: RoleName | string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'id' in parsed && 'email' in parsed) {
      return parsed as User;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Proveedor de autenticación:
 * - guarda el JWT en `localStorage` (`sicae_token`),
 * - cachea el perfil del usuario (`sicae_user`) y lo revalida con `GET /auth/me`,
 * - en 401/403 cierra la sesión de forma automática.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredToken()));
  const validatedTokenRef = useRef<string | null>(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const persistSession = useCallback((accessToken: string, nextUser: User) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(accessToken);
    setUser(nextUser);
  }, []);

  // Revalida el token guardado contra el backend (una sola vez por token).
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (validatedTokenRef.current === token) return;
    validatedTokenRef.current = token;

    let cancelled = false;
    setIsLoading(true);
    authApi
      .me()
      .then((profile) => {
        if (cancelled) return;
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        setUser(profile);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        // Token caducado o inválido → cierre de sesión; el resto de errores se
        // toleran para no desloguear por un fallo puntual de red.
        if (cause instanceof ApiError && (cause.statusCode === 401 || cause.statusCode === 403)) {
          clearSession();
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, clearSession]);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<User> => {
      const response = await authApi.login(credentials);
      validatedTokenRef.current = response.accessToken;
      persistSession(response.accessToken, response.user);
      return response.user;
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    validatedTokenRef.current = null;
    clearSession();
  }, [clearSession]);

  const hasRole = useCallback(
    (role: RoleName | string): boolean => Boolean(user?.roles.includes(role as RoleName)),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isLoading, login, logout, hasRole }),
    [token, user, isLoading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

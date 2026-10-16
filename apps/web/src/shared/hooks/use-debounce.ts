import { useEffect, useState } from 'react';

/**
 * Devuelve el valor tras un retardo (por defecto 350 ms) para no golpear la API
 * con una petición por tecla en campos de búsqueda.
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

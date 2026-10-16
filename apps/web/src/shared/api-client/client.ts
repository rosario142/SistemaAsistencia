/**
 * Cliente HTTP propio (sin axios) para la API de SICAE.
 *
 * - Base fija: `/api/v1` (en desarrollo Vite hace proxy hacia `http://localhost:3000`).
 * - Adjunta `Authorization: Bearer <token>` desde `localStorage` cuando existe.
 * - `FormData` se envía sin forzar `Content-Type` para que el navegador
 *   establece el `boundary` multipart correctamente.
 * - Los errores se normalizan en `ApiError` con `statusCode` y `message`.
 */

export const API_BASE_PATH = '/api/v1';

const TOKEN_STORAGE_KEY = 'sicae_token';

/** Error normalizado de la API: siempre expone código HTTP y mensaje legible. */
export class ApiError extends Error {
  readonly statusCode: number;
  /** Detalle adicional cuando el backend devuelve `message` como lista (validaciones). */
  readonly details: string[];

  constructor(statusCode: number, message: string, details: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  /** Query string; las claves con `undefined`, `null` o cadena vacía se omiten. */
  query?: Record<string, QueryValue>;
  /** Cuerpo JSON, o `FormData` para multipart (sin cabecera manual). */
  body?: unknown;
  signal?: AbortSignal;
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage puede no estar disponible (entornos restringidos).
    return null;
  }
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_BASE_PATH}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function isPlainBody(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !(body instanceof FormData);
}

function toApiError(status: number, payload: unknown, fallbackText: string): ApiError {
  if (payload && typeof payload === 'object') {
    const raw = (payload as { message?: unknown }).message;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return new ApiError(status, raw);
    }
    if (Array.isArray(raw) && raw.length > 0) {
      const details = raw.map((item) => String(item));
      return new ApiError(status, details[0], details.slice(1));
    }
    const error = (payload as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim().length > 0) {
      return new ApiError(status, error);
    }
  }
  const text = fallbackText.trim();
  if (text.length > 0 && text.length < 300 && !text.startsWith('<')) {
    return new ApiError(status, text);
  }
  return new ApiError(status, `Error en la solicitud (HTTP ${status}).`);
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = readToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    // Sin Content-Type: lo calcula el navegador con el boundary multipart.
    body = options.body;
  } else if (isPlainBody(options.body)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  } else if (options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      signal: options.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, 'No se pudo conectar con el servidor. Inténtalo de nuevo.');
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) throw toApiError(response.status, payload, text);
  return payload as T;
}

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, options);
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, { ...options, body });
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, { ...options, body });
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', path, { ...options, body });
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, options);
  },
};

/** Extrae el nombre de archivo sugerido por la cabecera `Content-Disposition`. */
function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      /* si la decodificación falla, se usa la variante simple */
    }
  }
  const plainMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  if (plainMatch?.[1]) return plainMatch[1].trim();
  return fallback;
}

/**
 * Descarga un archivo autenticado (reportes XLSX/PDF) usando un ancla temporal.
 * Lanza `ApiError` si el servidor responde con error.
 */
export async function download(
  path: string,
  query?: Record<string, QueryValue>,
  fallbackFilename = 'descarga',
): Promise<void> {
  const headers: Record<string, string> = {};
  const token = readToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { method: 'GET', headers });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Inténtalo de nuevo.');
  }

  if (!response.ok) {
    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }
    throw toApiError(response.status, payload, text);
  }

  const blob = await response.blob();
  const filename = filenameFromDisposition(response.headers.get('Content-Disposition'), fallbackFilename);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Se libera el objeto una vez el navegador ha iniciado la descarga.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/** Lectura directa del token guardado (usada por el provider de autenticación). */
export function getStoredToken(): string | null {
  return readToken();
}

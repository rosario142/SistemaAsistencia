import type { RoleName } from '@prisma/client';

/** Token de inyección del servicio de tokens JWT. */
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

/** Claims incluidos en el JWT de acceso. */
export interface TokenPayload {
  sub: string;
  email: string;
  roles: RoleName[];
}

/** Puerto de emisión/verificación de tokens de acceso. */
export interface TokenService {
  sign(payload: TokenPayload): Promise<string>;
  verify(token: string): TokenPayload;
}

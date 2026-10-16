/** Token de inyección del servicio de hashing de contraseñas. */
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

/** Puerto de hashing (implementación por defecto: argon2id). */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

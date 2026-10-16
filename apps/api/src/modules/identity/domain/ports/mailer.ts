/** Token de inyección del servicio de correo. */
export const MAILER = Symbol('MAILER');

/** Puerto de envío de correos electrónicos. */
export interface Mailer {
  sendPasswordReset(to: string, resetUrl: string): Promise<void>;
}

import { registerAs } from '@nestjs/config';

export interface AppConfigShape {
  nodeEnv: string;
  port: number;
  webOrigin: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  uploadDir: string;
  smtp: { host?: string; port: number; user?: string; pass?: string; from: string };
}

/**
 * Namespace de configuración accesible como `ConfigService.get('app')`.
 * La validación de variables de entorno vive en `validation.ts`.
 */
export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-cambiar',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  smtp: {
    host: process.env.SMTP_HOST || undefined,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER || undefined,
    pass: process.env.SMTP_PASS || undefined,
    from: process.env.SMTP_FROM ?? 'SICAE <no-reply@sicae.edu>',
  },
}));
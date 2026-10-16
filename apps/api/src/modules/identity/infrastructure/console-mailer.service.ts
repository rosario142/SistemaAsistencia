import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { AppConfigShape } from '../../../shared';
import type { Mailer } from '../domain/ports/mailer';

/**
 * Envío de correos: si no hay SMTP configurado (entorno de desarrollo),
 * se loguea el link de restablecimiento en consola; con SMTP usa nodemailer.
 */
@Injectable()
export class ConsoleMailerService implements Mailer {
  private readonly logger = new Logger(ConsoleMailerService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const smtp = this.config.get<AppConfigShape['smtp']>('app.smtp');

    if (!smtp?.host) {
      this.logger.log(`[PasswordReset] SMTP sin configurar. Link para ${to}: ${resetUrl}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    });

    await transporter.sendMail({
      from: smtp.from,
      to,
      subject: 'SICAE — Restablecer tu contraseña',
      text: `Recibimos una solicitud para restablecer tu contraseña. Abre este enlace (válido por 30 minutos): ${resetUrl}`,
      html: `<p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="${resetUrl}">Haz clic aquí para restablecerla</a> (válido por 30 minutos).</p>`,
    });
  }
}

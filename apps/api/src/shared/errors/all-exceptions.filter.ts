import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { DomainException } from './domain.errors';

export interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Filtro global de excepciones:
 * - DomainException → su statusCode y mensaje de negocio
 * - HttpException de Nest → su payload
 * - Errores conocidos de Prisma (P2002/P2025/P2003) → 409/404/409
 * - Cualquier otro → 500 genérico (el detalle se registra en logs)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error } = this.resolve(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `Error no controlado en ${request.method} ${request.url}: ${String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponseBody = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof DomainException) {
      return {
        statusCode: exception.statusCode,
        message: exception.message,
        error: exception.code,
      };
    }

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const statusCode = exception.getStatus();
      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: string | string[] }).message ?? exception.message);
      return { statusCode, message, error: exception.name };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'Ya existe un registro con esos datos únicos',
            error: 'CONFLICT',
          };
        case 'P2025':
          return {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'El registro solicitado no existe',
            error: 'NOT_FOUND',
          };
        case 'P2003':
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'Operación no permitida: existen registros dependientes',
            error: 'FOREIGN_KEY',
          };
        default:
          return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error de base de datos',
            error: `PRISMA_${exception.code}`,
          };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR',
    };
  }
}
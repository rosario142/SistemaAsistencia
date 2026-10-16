import { HttpStatus } from '@nestjs/common';

/**
 * Excepción base de negocio: sus mensajes son seguros para mostrar al cliente
 * y se traducen directamente a una respuesta HTTP en `AllExceptionsFilter`.
 */
export class DomainException extends Error {
  constructor(
    message: string,
    readonly statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    readonly code: string = 'DOMAIN_ERROR',
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class NotFoundError extends DomainException {
  constructor(resource: string, identifier?: string | number) {
    super(
      identifier === undefined
        ? `${resource}: registro no encontrado`
        : `${resource} con identificador '${identifier}' no encontrado`,
      HttpStatus.NOT_FOUND,
      'NOT_FOUND',
    );
  }
}

export class ConflictError extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT');
  }
}

export class ValidationError extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends DomainException {
  constructor(message = 'Credenciales inválidas o sesión expirada') {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends DomainException {
  constructor(message = 'No tienes permisos para realizar esta operación') {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }
}
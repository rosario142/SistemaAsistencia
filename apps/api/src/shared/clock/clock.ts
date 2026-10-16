import { Injectable } from '@nestjs/common';

/** Token de inyección para el reloj de dominio (permite controlar el tiempo en tests). */
export const CLOCK = Symbol('CLOCK');

export interface Clock {
  /** Fecha y hora actuales. */
  now(): Date;
  /** Fecha (sin hora) actual, normalizada a UTC medianoche. */
  today(): Date;
}

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  today(): Date {
    const now = this.now();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}
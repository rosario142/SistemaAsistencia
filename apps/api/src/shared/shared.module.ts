import { Global, Module } from '@nestjs/common';
import { CLOCK, SystemClock } from './clock/clock';

/**
 * Módulo global del kernel: reutilizables transversales (reloj, etc.)
 * que deben estar disponibles en cualquier módulo sin importarlo explícito.
 */
@Global()
@Module({
  providers: [{ provide: CLOCK, useClass: SystemClock }],
  exports: [CLOCK],
})
export class SharedModule {}
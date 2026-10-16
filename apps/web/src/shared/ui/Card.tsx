import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface CardProps {
  title?: string;
  /** Acciones alineadas a la derecha de la cabecera. */
  actions?: ReactNode;
  /** Quita el relleno interno del cuerpo (útil para tablas a sangre). */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({ title, actions, flush = false, className, children }: CardProps) {
  return (
    <section className={cn('card', className)}>
      {(title || actions) && (
        <header className="card__header">
          {title ? <h2 className="card__title">{title}</h2> : <span />}
          {actions ? <div className="card__actions">{actions}</div> : null}
        </header>
      )}
      <div className={cn('card__body', flush && 'card__body--flush')}>{children}</div>
    </section>
  );
}

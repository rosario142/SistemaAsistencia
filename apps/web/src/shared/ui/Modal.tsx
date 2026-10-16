import { useEffect, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Botones del pie (acciones principales). */
  footer?: ReactNode;
  /** Ancho máximo del panel. */
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

/**
 * Diálogo accesible: cierra con `Escape` o clic en el fondo,
 * y bloquea el scroll del cuerpo mientras está abierto.
 */
export function Modal({ open, title, onClose, footer, size = 'md', children }: ModalProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn('modal', `modal--${size}`)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal__header">
          <h2 className="modal__title" id="modal-title">
            {title}
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}

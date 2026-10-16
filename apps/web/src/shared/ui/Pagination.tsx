import { Button } from './Button';

export interface PaginationProps {
  page: number;
  pageSize?: number;
  total?: number;
  /**
   * Total de páginas. Si el backend omite `totalPages` en la respuesta,
   * se calcula a partir de `total` y `pageSize`.
   */
  totalPages?: number;
  onPageChange: (page: number) => void;
}

function resolveTotalPages(pageSize: number, total: number, totalPages?: number): number {
  if (typeof totalPages === 'number' && Number.isFinite(totalPages) && totalPages > 0) {
    return totalPages;
  }
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function Pagination({ page, pageSize = 20, total, totalPages, onPageChange }: PaginationProps) {
  const pages = resolveTotalPages(pageSize, total ?? 0, totalPages);
  const isFirst = page <= 1;
  const isLast = page >= pages;

  return (
    <nav className="pagination" aria-label="Paginación">
      <Button
        variant="ghost"
        disabled={isFirst}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
      >
        ← Anterior
      </Button>
      <span className="pagination__info">
        Página {page} de {pages}
        {typeof total === 'number' ? ` · ${total} registros` : ''}
      </span>
      <Button
        variant="ghost"
        disabled={isLast}
        onClick={() => onPageChange(page + 1)}
        aria-label="Página siguiente"
      >
        Siguiente →
      </Button>
    </nav>
  );
}

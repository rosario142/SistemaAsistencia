import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

/** Definición tipada de columna: el render recibe la fila completa. */
export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Ancho CSS opcional (`width`, `min-width`...). */
  width?: string;
  align?: 'left' | 'right' | 'center';
}

export interface TableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  /** Clave única de cada fila. */
  rowKey: (row: T) => string;
  emptyMessage?: string;
  caption?: string;
  className?: string;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'No hay registros que mostrar.',
  caption,
  className,
}: TableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="table__wrapper">
        <p className="empty-state">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table__wrapper">
      <table className={cn('table', className)}>
        {caption ? <caption className="table__caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={{ width: column.width, textAlign: column.align }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align }}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Envoltura estándar de respuestas paginadas. */
export class Page<T> {
  constructor(
    readonly items: T[],
    readonly total: number,
    readonly page: number,
    readonly pageSize: number,
  ) {}

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  static from<T>(items: T[], total: number, page: number, pageSize: number): Page<T> {
    return new Page(items, total, page, pageSize);
  }

  static async build<T>(
    page: number,
    pageSize: number,
    findMany: (args: { skip: number; take: number }) => Promise<T[]>,
    count: () => Promise<number>,
  ): Promise<Page<T>> {
    const [items, total] = await Promise.all([
      findMany({ skip: (page - 1) * pageSize, take: pageSize }),
      count(),
    ]);
    return Page.from(items, total, page, pageSize);
  }
}
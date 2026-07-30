export interface Pagination {
  page: number;
  pageSize: number;
  offset: number;
}

export function parsePagination(
  query: Record<string, unknown>,
  defaultPageSize: number,
  maxPageSize = 100
): Pagination {
  const rawPage = parseInt(String(query.page ?? '1'), 10);
  const rawPageSize = parseInt(String(query.pageSize ?? defaultPageSize), 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.min(rawPageSize, maxPageSize) : defaultPageSize;

  return { page, pageSize, offset: (page - 1) * pageSize };
}

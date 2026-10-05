import { EMPTY, Observable, expand, reduce } from 'rxjs';
import { Page } from '../../shared/models/domain.models';

/** Reúne las páginas para selectores y listas contextuales sin truncar registros. */
export function allPages<T>(load: (page: number) => Observable<Page<T>>): Observable<Page<T>> {
  return load(1).pipe(
    expand(result => result.page * result.page_size < result.total ? load(result.page + 1) : EMPTY),
    reduce((acc, result) => ({ ...result, page: 1, items: [...acc.items, ...result.items] }), { items: [] as T[], total: 0, page: 1, page_size: 100 }),
  );
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CatalogRead } from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class CatalogsApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/catalogs`;

  expenseCategories() {
    return this.http.get<CatalogRead[]>(
      `${this.url}/expense-categories`,
    );
  }

  expenseCategory(id: number) {
    return this.http.get<CatalogRead>(
      `${this.url}/expense-categories/${id}`,
    );
  }

  reservationTypes() {
    return this.http.get<CatalogRead[]>(
      `${this.url}/reservation-types`,
    );
  }

  reservationType(id: number) {
    return this.http.get<CatalogRead>(
      `${this.url}/reservation-types/${id}`,
    );
  }
}
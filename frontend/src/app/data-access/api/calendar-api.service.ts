import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { apiParams } from '../../core/http/api-params';
import {
  CalendarEventRead,
  CalendarFilters,
} from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly http = inject(HttpClient);

  list(filters: CalendarFilters) {
    return this.http.get<CalendarEventRead[]>(
      `${environment.apiUrl}/calendar`,
      { params: apiParams(filters) },
    );
  }
}
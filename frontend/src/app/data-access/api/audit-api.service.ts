import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { apiParams } from '../../core/http/api-params';
import {
  AuditFilters,
  AuditLogRead,
  Page,
} from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient);

  list(filters: AuditFilters = {}) {
    return this.http.get<Page<AuditLogRead>>(
      `${environment.apiUrl}/super-admin/audit-logs`,
      { params: apiParams(filters) },
    );
  }
}
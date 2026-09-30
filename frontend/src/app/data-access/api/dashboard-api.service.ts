import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DashboardRead } from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  get() {
    return this.http.get<DashboardRead>(
      `${environment.apiUrl}/dashboard`,
    );
  }
}
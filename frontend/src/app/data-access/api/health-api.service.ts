import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  HealthRead,
  ReadinessRead,
} from '../../shared/models/domain.models';

@Injectable({ providedIn: 'root' })
export class HealthApiService {
  private readonly http = inject(HttpClient);

  live() {
    return this.http.get<HealthRead>(
      `${environment.apiUrl}/health`,
    );
  }

  ready() {
    return this.http.get<ReadinessRead>(
      `${environment.apiUrl}/health/ready`,
    );
  }

  system() {
    return this.http.get<ReadinessRead>(
      `${environment.apiUrl}/super-admin/health`,
    );
  }
}
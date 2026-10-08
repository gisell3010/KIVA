import { Injectable, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, exhaustMap, filter, merge, Subject, switchMap, timer } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from '../core/auth/auth.service';
import { UsersApiService } from './api/users-api.service';

@Injectable({ providedIn: 'root' })
export class NotificationStateService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(UsersApiService);
  private readonly refreshEvents = new Subject<void>();
  readonly count = signal({ total: 0 });
  readonly unavailable = signal(false);

  constructor() {
    effect(() => { if (!this.auth.user()) this.count.set({ total: 0 }); }, { allowSignalWrites: true });
    toObservable(this.auth.currentUserId).pipe(
      switchMap(id => id ? merge(timer(0, 30_000).pipe(filter(() => !document.hidden)), this.refreshEvents).pipe(
        exhaustMap(() => this.api.unreadCount().pipe(catchError(() => { this.unavailable.set(true); return EMPTY; })))
      ) : EMPTY),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe(count => { this.count.set(count); this.unavailable.set(false); });
  }

  refresh(): void { this.refreshEvents.next(); }
}

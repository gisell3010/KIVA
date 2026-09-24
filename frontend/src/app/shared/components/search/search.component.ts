import { Component, signal, computed, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../../data-access/mock/mock-data.service';
import { Group, TripDestination, User } from '../../../shared/models/domain.models';

interface SearchResult {
  type: 'grupo' | 'destino' | 'usuario' | 'viaje';
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: string;
  iconBg: string;
  typeLabel: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  private mockData = inject(MockDataService);
  private elementRef = inject(ElementRef);

  query = signal('');
  isOpen = signal(false);

  results = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (q.length < 2) return [];

    const results: SearchResult[] = [];

    // Search groups
    for (const g of this.mockData.groups()) {
      if (g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)) {
        results.push({
          type: 'grupo',
          id: `grupo-${g.id}`,
          title: g.name,
          subtitle: g.description,
          route: `/grupos`,
          icon: 'M3 20l7-14 4 8 3-5 4 11H3Z',
          iconBg: `${g.colorTheme}22`,
          typeLabel: 'Grupo'
        });
      }
    }

    // Search trip destinations
    for (const d of this.mockData.tripDestinations()) {
      if (d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)) {
        const trip = this.mockData.trips().find(t => t.id === d.tripId);
        const group = trip ? this.mockData.groups().find(g => g.id === trip.groupId) : undefined;
        results.push({
          type: 'destino',
          id: `destino-${d.id}`,
          title: d.name,
          subtitle: `${d.country} · ${trip?.name || ''}${group ? ` (${group.name})` : ''}`,
          route: `/destinos`,
          icon: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z',
          iconBg: 'rgba(59,130,246,0.15)',
          typeLabel: 'Destino'
        });
      }
    }

    // Search users
    for (const u of this.mockData.users()) {
      if (u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)) {
        results.push({
          type: 'usuario',
          id: `usuario-${u.id}`,
          title: u.displayName,
          subtitle: u.email,
          route: `/participantes`,
          icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
          iconBg: `${u.avatarColor}22`,
          typeLabel: 'Participante'
        });
      }
    }

    return results.slice(0, 8);
  });

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.isOpen.set(true);
  }

  onFocus(): void {
    if (this.query().length >= 2) {
      this.isOpen.set(true);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen.set(false);
      (event.target as HTMLInputElement).blur();
    }
  }

  clear(): void {
    this.query.set('');
    this.isOpen.set(false);
  }

  selectResult(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
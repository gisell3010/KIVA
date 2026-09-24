import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../data-access/mock/mock-data.service';
import { Trip, Poll, PollOption } from '../../shared/models/domain.models';

@Component({
  selector: 'app-votaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './votaciones.component.html',
  styleUrl: './votaciones.component.css'
})
export class VotacionesComponent {
  protected mockData = inject(MockDataService);

  polls = this.mockData.polls;
  pollOptions = this.mockData.pollOptions;
  trips = this.mockData.trips;
  groups = this.mockData.groups;

  tripName(tripId: string): string {
    return this.trips().find(t => t.id === tripId)?.name || '';
  }

  groupName(groupId: string): string {
    return this.groups().find(g => g.id === groupId)?.name || '';
  }

  getPollOptions(pollId: string): PollOption[] {
    return this.pollOptions().filter(o => o.pollId === pollId);
  }

  totalVotes(pollId: string): number {
    const options = this.getPollOptions(pollId);
    return options.reduce((s, o) => s + o.votes, 0) || 1;
  }

  vote(pollId: string, optionId: string): void {
    this.pollOptions.update(list =>
      list.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
    );
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'OPEN': return 'badge-green';
      case 'CLOSED': return 'badge-red';
      default: return 'badge-gray';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'OPEN': return 'Abierta';
      case 'CLOSED': return 'Cerrada';
      default: return status;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
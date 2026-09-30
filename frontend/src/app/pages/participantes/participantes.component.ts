import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, map } from 'rxjs';
import { GroupsApiService } from '../../data-access/api/groups-api.service';
import { GroupMemberRead, GroupRead, GroupRole } from '../../shared/models/domain.models';
import { PrivateImageComponent } from '../../shared/components/private-image/private-image.component';
import { ApiError } from '../../core/http/error.interceptor';

interface ParticipantGroupMembership {
  groupId: number;
  groupName: string;
  role: GroupRole;
}

interface ParticipantView {
  user_id: number;
  full_name: string;
  username: string;
  profile_image: string | null;
  groupMemberships: ParticipantGroupMembership[];
}

@Component({
  selector: 'app-participantes',
  standalone: true,
  imports: [CommonModule, PrivateImageComponent],
  templateUrl: './participantes.component.html',
  styleUrl: './participantes.component.css'
})
export class ParticipantesComponent implements OnInit {
  private readonly groupsApi = inject(GroupsApiService);

  readonly participants = signal<ParticipantView[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadParticipants();
  }

  loadParticipants(): void {
    this.loading.set(true);
    this.error.set(null);

    this.groupsApi.list({
      page: 1,
      page_size: 100
    }).subscribe({
      next: page => {
        const groups = page.items;

        if (groups.length === 0) {
          this.participants.set([]);
          this.loading.set(false);
          return;
        }

        const requests = groups.map(group =>
          this.groupsApi.members(
            group.id,
            {
              page: 1,
              page_size: 100
            }
          ).pipe(
            map(memberPage => ({
              group,
              members: memberPage.items
            }))
          )
        );

        forkJoin(requests).subscribe({
          next: results => {
            this.participants.set(
              this.buildParticipants(results)
            );

            this.loading.set(false);
          },

          error: (err: unknown) => {
            this.handleError(err);
          }
        });
      },

      error: (err: unknown) => {
        this.handleError(err);
      }
    });
  }

  roleBadge(role: GroupRole): string {
    switch (role) {
      case 'OWNER':
        return 'badge-purple';

      case 'MEMBER':
        return 'badge-green';
    }
  }

  roleLabel(role: GroupRole): string {
    switch (role) {
      case 'OWNER':
        return 'Propietario';

      case 'MEMBER':
        return 'Miembro';
    }
  }

  getPrimaryRole(participant: ParticipantView): GroupRole {
    return participant.groupMemberships.some(
      membership => membership.role === 'OWNER'
    )
      ? 'OWNER'
      : 'MEMBER';
  }

  private buildParticipants(
    results: {
      group: GroupRead;
      members: GroupMemberRead[];
    }[]
  ): ParticipantView[] {
    const participants = new Map<number, ParticipantView>();

    for (const result of results) {
      for (const member of result.members) {
        const existing = participants.get(member.user_id);

        const membership: ParticipantGroupMembership = {
          groupId: result.group.id,
          groupName: result.group.name,
          role: member.role
        };

        if (existing) {
          existing.groupMemberships.push(membership);
          continue;
        }

        participants.set(
          member.user_id,
          {
            user_id: member.user_id,
            full_name: member.full_name,
            username: member.username,
            profile_image: member.profile_image,
            groupMemberships: [membership]
          }
        );
      }
    }

    return [...participants.values()].sort(
      (a, b) =>
        a.full_name.localeCompare(
          b.full_name,
          'es'
        )
    );
  }

  private handleError(err: unknown): void {
    this.participants.set([]);

    if (err instanceof ApiError) {
      this.error.set(err.message);
    } else {
      this.error.set(
        'Error al cargar los participantes.'
      );
    }

    this.loading.set(false);
  }
}
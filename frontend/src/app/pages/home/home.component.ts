import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface HomeFeature {
  title: string;
  description: string;
  icon: string;
}

interface HomeStep {
  number: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly features: HomeFeature[] = [
    {
      title: 'Viajes en grupo',
      description:
        'Crea grupos, organiza viajes y mantén a todos los participantes coordinados desde un mismo lugar.',
      icon:
        'M3 7h18v14H3z M8 7V3h8v4 M8 7v14 M16 7v14'
    },
    {
      title: 'Destinos y decisiones',
      description:
        'Propón destinos, comparte fotografías y utiliza votaciones para tomar decisiones con el grupo.',
      icon:
        'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6'
    },
    {
      title: 'Itinerario compartido',
      description:
        'Organiza actividades, fechas, horarios y lugares para construir un itinerario claro para todos.',
      icon:
        'M4 4h16v17H4z M8 8h8 M8 12h8 M8 16h5'
    },
    {
      title: 'Gastos del viaje',
      description:
        'Registra gastos, distribuye valores entre participantes y consulta balances en pesos colombianos.',
      icon:
        'M12 2v20 M17 5H9a4 4 0 0 0 0 8h6a3 3 0 0 1 0 6H6'
    },
    {
      title: 'Reservas organizadas',
      description:
        'Centraliza las reservas simuladas del viaje y consulta su estado junto con el resto de la planificación.',
      icon:
        'M5 3h14v19l-7-4-7 4z'
    },
    {
      title: 'Calendario y notificaciones',
      description:
        'Consulta fechas importantes, actividades, vencimientos y novedades relacionadas con tus viajes.',
      icon:
        'M3 5h18v16H3z M3 10h18 M8 2v6 M16 2v6'
    }
  ];

  readonly steps: HomeStep[] = [
    {
      number: '01',
      title: 'Crea tu cuenta',
      description:
        'Regístrate en KIVA y configura tu perfil.'
    },
    {
      number: '02',
      title: 'Forma tu grupo',
      description:
        'Crea un grupo y reúne a las personas con las que vas a viajar.'
    },
    {
      number: '03',
      title: 'Organiza el viaje',
      description:
        'Define destinos, actividades, gastos, votaciones y reservas desde un solo espacio.'
    }
  ];
}
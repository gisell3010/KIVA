import { Injectable, signal } from '@angular/core';
import {
  User, Group, GroupMember, Trip, TripMember, TripDestination,
  Activity, ItineraryDay, ItineraryItem, Poll, PollOption,
  Expense, ExpenseSplit, Reservation, ReservationParticipant,
  CalendarEvent, Notification, UUID, GlobalRole, GroupRole, TripRole,
  TripStatus, ActivityType, ExpenseCategory, ReservationStatus,
  CalendarEventType, PollStatus
} from '../../shared/models/domain.models';

function uuid(): UUID {
  return crypto.randomUUID();
}

const now = new Date().toISOString();

const MOCK_USERS: User[] = [
  {
    id: '1' as UUID,
    email: 'superadmin@kiva.app',
    firstName: 'Super',
    lastName: 'Admin',
    displayName: 'Super Admin',
    avatarColor: '#7c3aed',
    initials: 'SA',
    role: 'SUPER_ADMIN',
    bio: 'Super administrador de la plataforma KIVA',
    timezone: 'America/Bogota',
    locale: 'es',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: now,
  },
  {
    id: '2' as UUID,
    email: 'admin@kiva.app',
    firstName: 'Admin',
    lastName: 'User',
    displayName: 'Admin User',
    avatarColor: '#a855f7',
    initials: 'AU',
    role: 'ADMIN',
    bio: 'Administrador de la plataforma KIVA',
    timezone: 'America/Bogota',
    locale: 'es',
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: now,
  },
  {
    id: '3' as UUID,
    email: 'soporte@kiva.app',
    firstName: 'Soporte',
    lastName: 'KIVA',
    displayName: 'Soporte KIVA',
    avatarColor: '#22c55e',
    initials: 'SK',
    role: 'SUPPORT',
    bio: 'Equipo de soporte al usuario',
    timezone: 'America/Bogota',
    locale: 'es',
    createdAt: '2025-03-15T10:00:00Z',
    updatedAt: now,
  },
  {
    id: '4' as UUID,
    email: 'camila@kiva.app',
    firstName: 'Camila',
    lastName: 'Rojas',
    displayName: 'Camila Rojas',
    avatarColor: '#3b82f6',
    initials: 'CR',
    role: 'USER',
    bio: 'Amante de los viajes y la aventura',
    timezone: 'America/Bogota',
    locale: 'es',
    createdAt: '2025-04-20T14:30:00Z',
    updatedAt: now,
  },
  {
    id: '5' as UUID,
    email: 'julian@kiva.app',
    firstName: 'Julián',
    lastName: 'Pérez',
    displayName: 'Julián Pérez',
    avatarColor: '#22c55e',
    initials: 'JP',
    role: 'USER',
    bio: 'Fotógrafo de viajes',
    timezone: 'America/Bogota',
    locale: 'es',
    createdAt: '2025-05-10T09:15:00Z',
    updatedAt: now,
  },
  {
    id: '6' as UUID,
    email: 'valentina@kiva.app',
    firstName: 'Valentina',
    lastName: 'Gómez',
    displayName: 'Valentina Gómez',
    avatarColor: '#a855f7',
    initials: 'VG',
    role: 'USER',
    bio: 'Exploradora de destinos ocultos',
    timezone: 'America/Bogota',
    locale: 'es',
    createdAt: '2025-06-05T16:45:00Z',
    updatedAt: now,
  },
  {
    id: '7' as UUID,
    email: 'andres@kiva.app',
    firstName: 'Andrés',
    lastName: 'Torres',
    displayName: 'Andrés Torres',
    avatarColor: '#f97316',
    initials: 'AT',
    role: 'USER',
    bio: 'Mochoilero por el mundo',
    timezone: 'America/Bogota',
    locale: 'es',
    createdAt: '2025-07-12T11:20:00Z',
    updatedAt: now,
  },
  {
    id: '8' as UUID,
    email: 'laura@kiva.app',
    firstName: 'Laura',
    lastName: 'Méndez',
    displayName: 'Laura Méndez',
    avatarColor: '#ec4899',
    initials: 'LM',
    role: 'USER',
    bio: 'Disfruto planear viajes en grupo',
    timezone: 'America/Bogota',
    locale: 'es',
    createdAt: '2025-08-01T13:10:00Z',
    updatedAt: now,
  },
  {
    id: '9' as UUID,
    email: 'sebastian@kiva.app',
    firstName: 'Sebastián',
    lastName: 'Ruiz',
    displayName: 'Sebastián Ruiz',
    avatarColor: '#06b6d4',
    initials: 'SR',
    role: 'USER',
    bio: 'Viajero frecuente',
    timezone: 'America/Bogota',
    locale: 'es',
    createdAt: '2025-09-18T08:30:00Z',
    updatedAt: now,
  },
];

const MOCK_GROUPS: Group[] = [
  {
    id: '1' as UUID,
    name: 'Amigos de la Universidad',
    description: 'Grupo de amigos que viajamos juntos desde la uni',
    ownerId: '2' as UUID,
    colorTheme: '#3b82f6',
    createdAt: '2025-08-01T10:00:00Z',
    updatedAt: now,
  },
  {
    id: '2' as UUID,
    name: 'Familia Viajera',
    description: 'Viajes familiares anuales',
    ownerId: '3' as UUID,
    colorTheme: '#22c55e',
    createdAt: '2025-09-01T10:00:00Z',
    updatedAt: now,
  },
  {
    id: '3' as UUID,
    name: 'Compañeros de Trabajo',
    description: 'Equipo de trabajo que hace team building viajando',
    ownerId: '4' as UUID,
    colorTheme: '#a855f7',
    createdAt: '2025-10-01T10:00:00Z',
    updatedAt: now,
  },
];

const MOCK_GROUP_MEMBERS: GroupMember[] = [
  { id: '1' as UUID, groupId: '1' as UUID, userId: '2' as UUID, role: 'OWNER', joinedAt: '2025-08-01T10:00:00Z' },
  { id: '2' as UUID, groupId: '1' as UUID, userId: '3' as UUID, role: 'MEMBER', joinedAt: '2025-08-02T10:00:00Z' },
  { id: '3' as UUID, groupId: '1' as UUID, userId: '4' as UUID, role: 'MEMBER', joinedAt: '2025-08-03T10:00:00Z' },
  { id: '4' as UUID, groupId: '1' as UUID, userId: '5' as UUID, role: 'MEMBER', joinedAt: '2025-08-04T10:00:00Z' },
  { id: '5' as UUID, groupId: '2' as UUID, userId: '3' as UUID, role: 'OWNER', joinedAt: '2025-09-01T10:00:00Z' },
  { id: '6' as UUID, groupId: '2' as UUID, userId: '2' as UUID, role: 'MEMBER', joinedAt: '2025-09-02T10:00:00Z' },
  { id: '7' as UUID, groupId: '2' as UUID, userId: '6' as UUID, role: 'MEMBER', joinedAt: '2025-09-03T10:00:00Z' },
  { id: '8' as UUID, groupId: '2' as UUID, userId: '7' as UUID, role: 'MEMBER', joinedAt: '2025-09-04T10:00:00Z' },
  { id: '9' as UUID, groupId: '3' as UUID, userId: '4' as UUID, role: 'OWNER', joinedAt: '2025-10-01T10:00:00Z' },
  { id: '10' as UUID, groupId: '3' as UUID, userId: '5' as UUID, role: 'MEMBER', joinedAt: '2025-10-02T10:00:00Z' },
  { id: '11' as UUID, groupId: '3' as UUID, userId: '7' as UUID, role: 'MEMBER', joinedAt: '2025-10-03T10:00:00Z' },
];

const MOCK_TRIPS: Trip[] = [
  {
    id: '1' as UUID,
    groupId: '1' as UUID,
    name: 'Patagonia 2026',
    description: 'Trekking, glaciares y noches bajo las estrellas en El Chaltén',
    startDate: '2026-11-10',
    endDate: '2026-11-20',
    status: 'PLANNING',
    mainDestinationId: '1' as UUID,
    totalBudget: 8500000,
    createdAt: '2025-08-15T10:00:00Z',
    updatedAt: now,
  },
  {
    id: '2' as UUID,
    groupId: '1' as UUID,
    name: 'Caribe Colombiano 2026',
    description: 'Sol, arena blanca y buceo en arrecifes',
    startDate: '2026-12-05',
    endDate: '2026-12-12',
    status: 'CONFIRMED',
    mainDestinationId: '3' as UUID,
    totalBudget: 5200000,
    createdAt: '2025-09-01T10:00:00Z',
    updatedAt: now,
  },
  {
    id: '3' as UUID,
    groupId: '2' as UUID,
    name: 'Europa Clásica 2027',
    description: 'Roma, Barcelona y París en 14 días',
    startDate: '2027-03-02',
    endDate: '2027-03-16',
    status: 'PLANNING',
    mainDestinationId: '5' as UUID,
    totalBudget: 12000000,
    createdAt: '2025-10-15T10:00:00Z',
    updatedAt: now,
  },
  {
    id: '4' as UUID,
    groupId: '3' as UUID,
    name: 'Team Building Medellín',
    description: 'Retiro de equipo en la ciudad de la eterna primavera',
    startDate: '2026-06-15',
    endDate: '2026-06-18',
    status: 'PLANNING',
    totalBudget: 3500000,
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: now,
  },
];

const MOCK_TRIP_MEMBERS: TripMember[] = [
  { id: '1' as UUID, tripId: '1' as UUID, userId: '2' as UUID, role: 'OWNER', joinedAt: '2025-08-15T10:00:00Z' },
  { id: '2' as UUID, tripId: '1' as UUID, userId: '3' as UUID, role: 'ORGANIZER', joinedAt: '2025-08-16T10:00:00Z' },
  { id: '3' as UUID, tripId: '1' as UUID, userId: '4' as UUID, role: 'MEMBER', joinedAt: '2025-08-17T10:00:00Z' },
  { id: '4' as UUID, tripId: '1' as UUID, userId: '5' as UUID, role: 'MEMBER', joinedAt: '2025-08-18T10:00:00Z' },
  { id: '5' as UUID, tripId: '2' as UUID, userId: '2' as UUID, role: 'OWNER', joinedAt: '2025-09-01T10:00:00Z' },
  { id: '6' as UUID, tripId: '2' as UUID, userId: '4' as UUID, role: 'ORGANIZER', joinedAt: '2025-09-02T10:00:00Z' },
  { id: '7' as UUID, tripId: '2' as UUID, userId: '6' as UUID, role: 'MEMBER', joinedAt: '2025-09-03T10:00:00Z' },
  { id: '8' as UUID, tripId: '2' as UUID, userId: '7' as UUID, role: 'MEMBER', joinedAt: '2025-09-04T10:00:00Z' },
  { id: '9' as UUID, tripId: '3' as UUID, userId: '3' as UUID, role: 'OWNER', joinedAt: '2025-10-15T10:00:00Z' },
  { id: '10' as UUID, tripId: '3' as UUID, userId: '2' as UUID, role: 'MEMBER', joinedAt: '2025-10-16T10:00:00Z' },
  { id: '11' as UUID, tripId: '3' as UUID, userId: '6' as UUID, role: 'MEMBER', joinedAt: '2025-10-17T10:00:00Z' },
  { id: '12' as UUID, tripId: '3' as UUID, userId: '7' as UUID, role: 'MEMBER', joinedAt: '2025-10-18T10:00:00Z' },
];

const MOCK_TRIP_DESTINATIONS: TripDestination[] = [
  { id: '1' as UUID, tripId: '1' as UUID, name: 'El Chaltén', country: 'Argentina', description: 'Capital del trekking en Patagonia', estimatedCost: 2100000, votes: 4, createdAt: '2025-08-20T10:00:00Z' },
  { id: '2' as UUID, tripId: '1' as UUID, name: 'Torres del Paine', country: 'Chile', description: 'Parque nacional icónico', estimatedCost: 2600000, votes: 2, createdAt: '2025-08-21T10:00:00Z' },
  { id: '3' as UUID, tripId: '2' as UUID, name: 'Cartagena', country: 'Colombia', description: 'Ciudad amurallada y playas cercanas', estimatedCost: 1500000, votes: 5, createdAt: '2025-09-10T10:00:00Z' },
  { id: '4' as UUID, tripId: '2' as UUID, name: 'San Andrés', country: 'Colombia', description: 'Mar de siete colores', estimatedCost: 1800000, votes: 3, createdAt: '2025-09-11T10:00:00Z' },
  { id: '5' as UUID, tripId: '3' as UUID, name: 'Roma', country: 'Italia', description: 'Historia antigua en cada esquina', estimatedCost: 3200000, votes: 3, createdAt: '2025-10-20T10:00:00Z' },
  { id: '6' as UUID, tripId: '3' as UUID, name: 'Barcelona', country: 'España', description: 'Arte, playa y arquitectura de Gaudí', estimatedCost: 3000000, votes: 3, createdAt: '2025-10-21T10:00:00Z' },
];

const MOCK_ACTIVITIES: Activity[] = [
  { id: '1' as UUID, tripId: '1' as UUID, name: 'Vuelo a El Calafate', description: 'Salida desde Bogotá con escala', type: 'TRANSFER', estimatedCost: 950000, startDate: '2026-11-10T08:00:00', endDate: '2026-11-10T14:00:00', status: 'CONFIRMED', createdAt: now },
  { id: '2' as UUID, tripId: '1' as UUID, name: 'Check-in Hostal El Chaltén', description: 'Alojamiento compartido 4 noches', type: 'ACCOMMODATION', estimatedCost: 320000, startDate: '2026-11-10T18:00:00', endDate: '2026-11-10T20:00:00', status: 'CONFIRMED', createdAt: now },
  { id: '3' as UUID, tripId: '1' as UUID, name: 'Trekking Laguna de los Tres', description: 'Ruta de día completo, llevar almuerzo', type: 'TOUR', estimatedCost: 0, startDate: '2026-11-11T07:30:00', endDate: '2026-11-11T18:00:00', status: 'CONFIRMED', createdAt: now },
  { id: '4' as UUID, tripId: '1' as UUID, name: 'Almuerzo regional', description: 'Cordero patagónico en refugio local', type: 'MEAL', estimatedCost: 85000, startDate: '2026-11-12T13:00:00', endDate: '2026-11-12T15:00:00', status: 'CONFIRMED', createdAt: now },
  { id: '5' as UUID, tripId: '2' as UUID, name: 'Vuelo a Cartagena', description: 'Vuelo directo', type: 'TRANSFER', estimatedCost: 480000, startDate: '2026-12-05T09:00:00', endDate: '2026-12-05T11:00:00', status: 'CONFIRMED', createdAt: now },
  { id: '6' as UUID, tripId: '2' as UUID, name: 'Tour Islas del Rosario', description: 'Snorkel incluido', type: 'TOUR', estimatedCost: 250000, startDate: '2026-12-06T10:00:00', endDate: '2026-12-06T16:00:00', status: 'CONFIRMED', createdAt: now },
];

const MOCK_ITINERARY_DAYS: ItineraryDay[] = [
  { id: '1' as UUID, tripId: '1' as UUID, date: '2026-11-10', dayNumber: 1 },
  { id: '2' as UUID, tripId: '1' as UUID, date: '2026-11-11', dayNumber: 2 },
  { id: '3' as UUID, tripId: '1' as UUID, date: '2026-11-12', dayNumber: 3 },
  { id: '4' as UUID, tripId: '2' as UUID, date: '2026-12-05', dayNumber: 1 },
  { id: '5' as UUID, tripId: '2' as UUID, date: '2026-12-06', dayNumber: 2 },
];

const MOCK_ITINERARY_ITEMS: ItineraryItem[] = [
  { id: '1' as UUID, itineraryDayId: '1' as UUID, activityId: '1' as UUID, time: '08:00', title: 'Vuelo a El Calafate', description: 'Salida desde Bogotá con escala', type: 'TRANSFER', cost: 950000, responsibleUserId: '2' as UUID, order: 1 },
  { id: '2' as UUID, itineraryDayId: '1' as UUID, activityId: '2' as UUID, time: '18:00', title: 'Check-in Hostal El Chaltén', description: 'Alojamiento compartido 4 noches', type: 'ACCOMMODATION', cost: 320000, responsibleUserId: '3' as UUID, order: 2 },
  { id: '3' as UUID, itineraryDayId: '2' as UUID, activityId: '3' as UUID, time: '07:30', title: 'Trekking Laguna de los Tres', description: 'Ruta de día completo, llevar almuerzo', type: 'TOUR', cost: 0, responsibleUserId: '4' as UUID, order: 1 },
  { id: '4' as UUID, itineraryDayId: '3' as UUID, activityId: '4' as UUID, time: '13:00', title: 'Almuerzo regional', description: 'Cordero patagónico en refugio local', type: 'MEAL', cost: 85000, responsibleUserId: '5' as UUID, order: 1 },
  { id: '5' as UUID, itineraryDayId: '4' as UUID, activityId: '5' as UUID, time: '09:00', title: 'Vuelo a Cartagena', description: 'Vuelo directo', type: 'TRANSFER', cost: 480000, responsibleUserId: '2' as UUID, order: 1 },
  { id: '6' as UUID, itineraryDayId: '5' as UUID, activityId: '6' as UUID, time: '10:00', title: 'Tour Islas del Rosario', description: 'Snorkel incluido', type: 'TOUR', cost: 250000, responsibleUserId: '7' as UUID, order: 1 },
];

const MOCK_POLLS: Poll[] = [
  {
    id: '1' as UUID, tripId: '1' as UUID, title: '¿Dónde alojarnos en El Chaltén?',
    description: 'Elige la opción preferida para las 4 noches.',
    status: 'OPEN', closesAt: '2026-09-25T23:59:00Z', createdAt: '2025-09-01T10:00:00Z', createdById: '2' as UUID
  },
  {
    id: '2' as UUID, tripId: '2' as UUID, title: '¿Qué excursión hacemos el día 3?',
    description: 'Vota por la actividad grupal.',
    status: 'CLOSED', closesAt: '2026-09-10T23:59:00Z', createdAt: '2025-09-05T10:00:00Z', createdById: '2' as UUID
  },
];

const MOCK_POLL_OPTIONS: PollOption[] = [
  { id: '1' as UUID, pollId: '1' as UUID, text: 'Hostal Patagonia Base', votes: 3, order: 1 },
  { id: '2' as UUID, pollId: '1' as UUID, text: 'Cabañas Cerro Torre', votes: 1, order: 2 },
  { id: '3' as UUID, pollId: '2' as UUID, text: 'Buceo en arrecife', votes: 2, order: 1 },
  { id: '4' as UUID, pollId: '2' as UUID, text: 'Tour ciudad amurallada', votes: 4, order: 2 },
];

const MOCK_EXPENSES: Expense[] = [
  { id: '1' as UUID, tripId: '1' as UUID, concept: 'Vuelos grupales', category: 'TRANSPORT', amount: 3800000, paidById: '2' as UUID, date: '2026-09-01', splitBetween: ['2','3','4','5'] as UUID[], createdAt: now },
  { id: '2' as UUID, tripId: '1' as UUID, concept: 'Hostal 4 noches', category: 'ACCOMMODATION', amount: 1280000, paidById: '3' as UUID, date: '2026-09-03', splitBetween: ['2','3','4','5'] as UUID[], createdAt: now },
  { id: '3' as UUID, tripId: '1' as UUID, concept: 'Equipo de camping', category: 'OTHER', amount: 450000, paidById: '4' as UUID, date: '2026-09-05', splitBetween: ['2','3','4','5'] as UUID[], createdAt: now },
  { id: '4' as UUID, tripId: '2' as UUID, concept: 'Hotel frente al mar', category: 'ACCOMMODATION', amount: 2100000, paidById: '2' as UUID, date: '2026-09-10', splitBetween: ['2','4','6','7'] as UUID[], createdAt: now },
  { id: '5' as UUID, tripId: '2' as UUID, concept: 'Tour islas', category: 'ACTIVITIES', amount: 900000, paidById: '7' as UUID, date: '2026-09-12', splitBetween: ['2','4','6','7'] as UUID[], createdAt: now },
];

const MOCK_RESERVATIONS: Reservation[] = [
  { id: '1' as UUID, tripId: '1' as UUID, type: 'FLIGHT', provider: 'Aerolíneas Patagonia', detail: 'Bogotá → El Calafate', date: '2026-11-10', cost: 950000, status: 'SIMULATED', createdAt: now },
  { id: '2' as UUID, tripId: '1' as UUID, type: 'HOTEL', provider: 'Hostal Patagonia Base', detail: '4 noches, habitación grupal', date: '2026-11-10', cost: 320000, status: 'PENDING', createdAt: now },
  { id: '3' as UUID, tripId: '2' as UUID, type: 'FLIGHT', provider: 'SkyCaribe', detail: 'Bogotá → Cartagena', date: '2026-12-05', cost: 480000, status: 'CONFIRMED', createdAt: now },
  { id: '4' as UUID, tripId: '2' as UUID, type: 'ACTIVITY', provider: 'Rosario Tours', detail: 'Snorkel + almuerzo', date: '2026-12-06', cost: 250000, status: 'CONFIRMED', createdAt: now },
];

const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: '1' as UUID, tripId: '1' as UUID, date: '2026-11-10', title: 'Vuelo a El Calafate', type: 'RESERVATION', relatedEntityId: '1' as UUID, relatedEntityType: 'RESERVATION' },
  { id: '2' as UUID, tripId: '1' as UUID, date: '2026-11-11', title: 'Trekking Laguna de los Tres', type: 'ACTIVITY', relatedEntityId: '3' as UUID, relatedEntityType: 'ACTIVITY' },
  { id: '3' as UUID, tripId: '1' as UUID, date: '2026-09-25', title: 'Cierre votación alojamiento', type: 'VOTING', relatedEntityId: '1' as UUID, relatedEntityType: 'POLL' },
  { id: '4' as UUID, tripId: '2' as UUID, date: '2026-12-05', title: 'Vuelo a Cartagena', type: 'RESERVATION', relatedEntityId: '3' as UUID, relatedEntityType: 'RESERVATION' },
  { id: '5' as UUID, tripId: '2' as UUID, date: '2026-12-06', title: 'Tour Islas del Rosario', type: 'ACTIVITY', relatedEntityId: '6' as UUID, relatedEntityType: 'ACTIVITY' },
];

@Injectable({ providedIn: 'root' })
export class MockDataService {
  users = signal<User[]>(MOCK_USERS);
  groups = signal<Group[]>(MOCK_GROUPS);
  groupMembers = signal<GroupMember[]>(MOCK_GROUP_MEMBERS);
  trips = signal<Trip[]>(MOCK_TRIPS);
  tripMembers = signal<TripMember[]>(MOCK_TRIP_MEMBERS);
  tripDestinations = signal<TripDestination[]>(MOCK_TRIP_DESTINATIONS);
  activities = signal<Activity[]>(MOCK_ACTIVITIES);
  itineraryDays = signal<ItineraryDay[]>(MOCK_ITINERARY_DAYS);
  itineraryItems = signal<ItineraryItem[]>(MOCK_ITINERARY_ITEMS);
  polls = signal<Poll[]>(MOCK_POLLS);
  pollOptions = signal<PollOption[]>(MOCK_POLL_OPTIONS);
  expenses = signal<Expense[]>(MOCK_EXPENSES);
  reservations = signal<Reservation[]>(MOCK_RESERVATIONS);
  calendarEvents = signal<CalendarEvent[]>(MOCK_CALENDAR_EVENTS);

  getUser(id: UUID): User | undefined {
    return this.users().find(u => u.id === id);
  }

  getGroup(id: UUID): Group | undefined {
    return this.groups().find(g => g.id === id);
  }

  getTrip(id: UUID): Trip | undefined {
    return this.trips().find(t => t.id === id);
  }

  getGroupMembers(groupId: UUID): GroupMember[] {
    return this.groupMembers().filter(m => m.groupId === groupId);
  }

  getTripMembers(tripId: UUID): TripMember[] {
    return this.tripMembers().filter(m => m.tripId === tripId);
  }

  getTripDestinations(tripId: UUID): TripDestination[] {
    return this.tripDestinations().filter(d => d.tripId === tripId);
  }

  getTripActivities(tripId: UUID): Activity[] {
    return this.activities().filter(a => a.tripId === tripId);
  }

  getItineraryDays(tripId: UUID): ItineraryDay[] {
    return this.itineraryDays().filter(d => d.tripId === tripId).sort((a, b) => a.dayNumber - b.dayNumber);
  }

  getItineraryItems(dayId: UUID): ItineraryItem[] {
    return this.itineraryItems().filter(i => i.itineraryDayId === dayId).sort((a, b) => a.order - b.order);
  }

  getTripPolls(tripId: UUID): Poll[] {
    return this.polls().filter(p => p.tripId === tripId);
  }

  getPollOptions(pollId: UUID): PollOption[] {
    return this.pollOptions().filter(o => o.pollId === pollId);
  }

  getTripExpenses(tripId: UUID): Expense[] {
    return this.expenses().filter(e => e.tripId === tripId);
  }

  getTripReservations(tripId: UUID): Reservation[] {
    return this.reservations().filter(r => r.tripId === tripId);
  }

  getTripCalendarEvents(tripId: UUID): CalendarEvent[] {
    return this.calendarEvents().filter(e => e.tripId === tripId);
  }
}
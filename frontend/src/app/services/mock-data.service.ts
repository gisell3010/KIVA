import { Injectable, signal } from '@angular/core';
import {
  Usuario, Grupo, Destino, ActividadItinerario, Gasto, Votacion, Reserva, EventoCalendario
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class MockDataService {

  usuarios = signal<Usuario[]>([
    { id: 1, nombre: 'Camila Rojas', email: 'camila@viajes.com', avatarColor: '#3b82f6', iniciales: 'CR', rol: 'ADMIN' },
    { id: 2, nombre: 'Julián Pérez', email: 'julian@viajes.com', avatarColor: '#22c55e', iniciales: 'JP', rol: 'USER' },
    { id: 3, nombre: 'Valentina Gómez', email: 'valentina@viajes.com', avatarColor: '#a855f7', iniciales: 'VG', rol: 'USER' },
    { id: 4, nombre: 'Andrés Torres', email: 'andres@viajes.com', avatarColor: '#f97316', iniciales: 'AT', rol: 'USER' },
    { id: 5, nombre: 'Laura Méndez', email: 'laura@viajes.com', avatarColor: '#ec4899', iniciales: 'LM', rol: 'SUPPORT' },
    { id: 6, nombre: 'Sebastián Ruiz', email: 'sebastian@viajes.com', avatarColor: '#06b6d4', iniciales: 'SR', rol: 'USER' },
  ]);

  grupos = signal<Grupo[]>([
    {
      id: 1, nombre: 'Aventura en la Patagonia', descripcion: 'Trekking, glaciares y noches bajo las estrellas.',
      destinoPrincipal: 'El Chaltén, Argentina', fechaInicio: '2026-11-10', fechaFin: '2026-11-20',
      imagenEmoji: '🏔️', colorTema: '#3b82f6', participantesIds: [1, 2, 3, 4], presupuestoTotal: 8500000,
      estado: 'Planeando'
    },
    {
      id: 2, nombre: 'Playas del Caribe', descripcion: 'Sol, arena blanca y buceo en arrecifes.',
      destinoPrincipal: 'Cartagena, Colombia', fechaInicio: '2026-12-05', fechaFin: '2026-12-12',
      imagenEmoji: '🏝️', colorTema: '#06b6d4', participantesIds: [1, 3, 5, 6], presupuestoTotal: 5200000,
      estado: 'Confirmado'
    },
    {
      id: 3, nombre: 'Ruta Europea', descripcion: 'Tres ciudades, tres culturas, un solo viaje.',
      destinoPrincipal: 'Roma, Italia', fechaInicio: '2027-03-02', fechaFin: '2027-03-16',
      imagenEmoji: '🏛️', colorTema: '#a855f7', participantesIds: [2, 4, 6], presupuestoTotal: 12000000,
      estado: 'Planeando'
    },
  ]);

  destinos = signal<Destino[]>([
    { id: 1, grupoId: 1, nombre: 'El Chaltén', pais: 'Argentina', emoji: '🏔️', descripcion: 'Capital del trekking en Patagonia.', votos: 4, costoEstimado: 2100000 },
    { id: 2, grupoId: 1, nombre: 'Torres del Paine', pais: 'Chile', emoji: '⛰️', descripcion: 'Parque nacional icónico.', votos: 2, costoEstimado: 2600000 },
    { id: 3, grupoId: 2, nombre: 'Cartagena', pais: 'Colombia', emoji: '🏝️', descripcion: 'Ciudad amurallada y playas cercanas.', votos: 5, costoEstimado: 1500000 },
    { id: 4, grupoId: 2, nombre: 'San Andrés', pais: 'Colombia', emoji: '🐠', descripcion: 'Mar de siete colores.', votos: 3, costoEstimado: 1800000 },
    { id: 5, grupoId: 3, nombre: 'Roma', pais: 'Italia', emoji: '🏛️', descripcion: 'Historia antigua en cada esquina.', votos: 3, costoEstimado: 3200000 },
    { id: 6, grupoId: 3, nombre: 'Barcelona', pais: 'España', emoji: '🏖️', descripcion: 'Arte, playa y arquitectura de Gaudí.', votos: 3, costoEstimado: 3000000 },
  ]);

  itinerario = signal<ActividadItinerario[]>([
    { id: 1, grupoId: 1, dia: 1, fecha: '2026-11-10', hora: '08:00', titulo: 'Vuelo a El Calafate', descripcion: 'Salida desde Bogotá con escala.', tipo: 'Traslado', costo: 950000, responsableId: 1 },
    { id: 2, grupoId: 1, dia: 1, fecha: '2026-11-10', hora: '18:00', titulo: 'Check-in hostal El Chaltén', descripcion: 'Alojamiento compartido 4 noches.', tipo: 'Alojamiento', costo: 320000, responsableId: 2 },
    { id: 3, grupoId: 1, dia: 2, fecha: '2026-11-11', hora: '07:30', titulo: 'Trekking Laguna de los Tres', descripcion: 'Ruta de día completo, llevar almuerzo.', tipo: 'Tour', costo: 0, responsableId: 3 },
    { id: 4, grupoId: 1, dia: 3, fecha: '2026-11-12', hora: '13:00', titulo: 'Almuerzo regional', descripcion: 'Cordero patagónico en refugio local.', tipo: 'Comida', costo: 85000, responsableId: 4 },
    { id: 5, grupoId: 2, dia: 1, fecha: '2026-12-05', hora: '09:00', titulo: 'Vuelo a Cartagena', descripcion: 'Vuelo directo.', tipo: 'Traslado', costo: 480000, responsableId: 1 },
    { id: 6, grupoId: 2, dia: 2, fecha: '2026-12-06', hora: '10:00', titulo: 'Tour Islas del Rosario', descripcion: 'Snorkel incluido.', tipo: 'Tour', costo: 250000, responsableId: 6 },
  ]);

  gastos = signal<Gasto[]>([
    { id: 1, grupoId: 1, concepto: 'Vuelos grupales', categoria: 'Transporte', monto: 3800000, pagadoPorId: 1, fecha: '2026-09-01', divididoEntre: [1, 2, 3, 4] },
    { id: 2, grupoId: 1, concepto: 'Hostal 4 noches', categoria: 'Alojamiento', monto: 1280000, pagadoPorId: 2, fecha: '2026-09-03', divididoEntre: [1, 2, 3, 4] },
    { id: 3, grupoId: 1, concepto: 'Equipo de camping', categoria: 'Otros', monto: 450000, pagadoPorId: 3, fecha: '2026-09-05', divididoEntre: [1, 2, 3, 4] },
    { id: 4, grupoId: 2, concepto: 'Hotel frente al mar', categoria: 'Alojamiento', monto: 2100000, pagadoPorId: 1, fecha: '2026-09-10', divididoEntre: [1, 3, 5, 6] },
    { id: 5, grupoId: 2, concepto: 'Tour islas', categoria: 'Actividades', monto: 900000, pagadoPorId: 6, fecha: '2026-09-12', divididoEntre: [1, 3, 5, 6] },
  ]);

  votaciones = signal<Votacion[]>([
    {
      id: 1, grupoId: 1, titulo: '¿Dónde alojarnos en El Chaltén?',
      descripcion: 'Elige la opción preferida para las 4 noches.',
      opciones: [
        { id: 1, texto: 'Hostal Patagonia Base', votos: 3 },
        { id: 2, texto: 'Cabañas Cerro Torre', votos: 1 },
      ],
      estado: 'Abierta', fechaCierre: '2026-09-25'
    },
    {
      id: 2, grupoId: 2, titulo: '¿Qué excursión hacemos el día 3?',
      descripcion: 'Vota por la actividad grupal.',
      opciones: [
        { id: 3, texto: 'Buceo en arrecife', votos: 2 },
        { id: 4, texto: 'Tour ciudad amurallada', votos: 4 },
      ],
      estado: 'Cerrada', fechaCierre: '2026-09-10'
    },
  ]);

  reservas = signal<Reserva[]>([
    { id: 1, grupoId: 1, tipo: 'Vuelo', proveedor: 'Aerolíneas Patagonia', detalle: 'Bogotá → El Calafate', fecha: '2026-11-10', costo: 950000, estado: 'Simulada', emoji: '✈️' },
    { id: 2, grupoId: 1, tipo: 'Hotel', proveedor: 'Hostal Patagonia Base', detalle: '4 noches, habitación grupal', fecha: '2026-11-10', costo: 320000, estado: 'Pendiente', emoji: '🏨' },
    { id: 3, grupoId: 2, tipo: 'Vuelo', proveedor: 'SkyCaribe', detalle: 'Bogotá → Cartagena', fecha: '2026-12-05', costo: 480000, estado: 'Confirmada', emoji: '✈️' },
    { id: 4, grupoId: 2, tipo: 'Actividad', proveedor: 'Rosario Tours', detalle: 'Snorkel + almuerzo', fecha: '2026-12-06', costo: 250000, estado: 'Confirmada', emoji: '🤿' },
  ]);

  eventosCalendario = signal<EventoCalendario[]>([
    { id: 1, grupoId: 1, fecha: '2026-11-10', titulo: 'Vuelo a El Calafate', tipo: 'Reserva' },
    { id: 2, grupoId: 1, fecha: '2026-11-11', titulo: 'Trekking Laguna de los Tres', tipo: 'Actividad' },
    { id: 3, grupoId: 1, fecha: '2026-09-25', titulo: 'Cierre votación alojamiento', tipo: 'Votacion' },
    { id: 4, grupoId: 2, fecha: '2026-12-05', titulo: 'Vuelo a Cartagena', tipo: 'Reserva' },
    { id: 5, grupoId: 2, fecha: '2026-12-06', titulo: 'Tour Islas del Rosario', tipo: 'Actividad' },
  ]);

  getUsuario(id: number) {
    return this.usuarios().find(u => u.id === id);
  }
}

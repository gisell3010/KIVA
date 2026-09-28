export type GlobalRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'USER';

export type Rol = GlobalRole;

export const GLOBAL_ROLE_HIERARCHY: Record<GlobalRole, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  SUPPORT: 60,
  USER: 20,
};

export const GLOBAL_ROLE_LABELS: Record<GlobalRole, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  SUPPORT: 'Soporte',
  USER: 'Usuario',
};

export function hasGlobalRole(userRole: GlobalRole, requiredRole: GlobalRole): boolean {
  return GLOBAL_ROLE_HIERARCHY[userRole] >= GLOBAL_ROLE_HIERARCHY[requiredRole];
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  avatarColor: string;
  iniciales: string;
  rol: Rol;
}

export interface Grupo {
  id: number;
  nombre: string;
  descripcion: string;
  destinoPrincipal: string;
  fechaInicio: string;
  fechaFin: string;
  imagenEmoji: string;
  colorTema: string;
  participantesIds: number[];
  presupuestoTotal: number;
  estado: 'Planeando' | 'Confirmado' | 'En curso' | 'Finalizado';
}

export interface Destino {
  id: number;
  grupoId: number;
  nombre: string;
  pais: string;
  emoji: string;
  descripcion: string;
  votos: number;
  costoEstimado: number;
  imagenUrl?: string;
}

export interface ActividadItinerario {
  id: number;
  grupoId: number;
  dia: number;
  fecha: string;
  hora: string;
  titulo: string;
  descripcion: string;
  tipo: 'Traslado' | 'Alojamiento' | 'Comida' | 'Tour' | 'Ocio' | 'Otro';
  costo: number;
  responsableId: number;
}

export interface Gasto {
  id: number;
  grupoId: number;
  concepto: string;
  categoria: 'Transporte' | 'Alojamiento' | 'Comida' | 'Actividades' | 'Otros';
  monto: number;
  pagadoPorId: number;
  fecha: string;
  divididoEntre: number[];
}

export interface OpcionVotacion {
  id: number;
  texto: string;
  votos: number;
}

export interface Votacion {
  id: number;
  grupoId: number;
  titulo: string;
  descripcion: string;
  opciones: OpcionVotacion[];
  estado: 'Abierta' | 'Cerrada';
  fechaCierre: string;
}

export interface Reserva {
  id: number;
  grupoId: number;
  tipo: 'Vuelo' | 'Hotel' | 'Actividad' | 'Transporte';
  proveedor: string;
  detalle: string;
  fecha: string;
  costo: number;
  estado: 'Simulada' | 'Pendiente' | 'Confirmada';
  emoji: string;
}

export interface EventoCalendario {
  id: number;
  grupoId: number;
  fecha: string;
  titulo: string;
  tipo: 'Actividad' | 'Reserva' | 'Votacion' | 'Pago';
}

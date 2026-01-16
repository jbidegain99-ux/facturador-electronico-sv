export type DTEStatus = 'PENDIENTE' | 'PROCESANDO' | 'PROCESADO' | 'RECHAZADO' | 'ANULADO' | 'ERROR';
export type TipoDte = '01' | '03' | '05' | '06';

export interface DTERecord {
  id: string;
  tenantId: string;
  codigoGeneracion: string;
  numeroControl: string;
  tipoDte: TipoDte;
  ambiente: '00' | '01';
  status: DTEStatus;
  selloRecibido?: string;
  fhProcesamiento?: string;
  observaciones?: string[];
  totalPagar: number;
  receptorNombre: string;
  receptorDocumento: string;
  intentos: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cliente {
  id: string;
  tipoDocumento: '36' | '13' | '02' | '03' | '37';
  numDocumento: string;
  nrc?: string;
  nombre: string;
  codActividad?: string;
  descActividad?: string;
  direccion?: {
    departamento: string;
    municipio: string;
    complemento: string;
  };
  telefono?: string;
  correo?: string;
  createdAt: string;
}

export interface ItemFactura {
  id: string;
  codigo?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  esGravado: boolean;
  esExento: boolean;
  descuento: number;
  subtotal: number;
  iva: number;
  total: number;
}

export interface DashboardMetrics {
  dtesHoy: number;
  dtesMes: number;
  totalFacturado: number;
  rechazados: number;
  dtesUltimos7Dias: { fecha: string; cantidad: number }[];
}

export interface DTELog {
  id: string;
  action: string;
  status: 'SUCCESS' | 'FAILURE';
  message: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Tenant {
  id: string;
  nombre: string;
  nit: string;
  nrc: string;
  correo: string;
}

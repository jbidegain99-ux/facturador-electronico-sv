export type PurchaseStatus = 'DRAFT' | 'POSTED' | 'PAID' | 'ANULADA';
export type TipoDocProveedor = 'FC' | 'CCF' | 'NCF' | 'NDF' | 'OTRO';
export type FormaPago = 'contado' | 'credito';
export type PurchaseLineTipo = 'bien' | 'servicio';

export interface Proveedor {
  id: string;
  tenantId: string;
  tipoDocumento: string;
  numDocumento: string;
  nombre: string;
  nrc: string | null;
  correo: string | null;
  telefono: string | null;
  direccion: string;
  isCustomer: boolean;
  isSupplier: boolean;
  esGranContribuyente: boolean;
  retieneISR: boolean;
  cuentaCxPDefaultId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseLine {
  id?: string;
  tipo: PurchaseLineTipo;
  descripcion: string;
  itemId?: string;           // required si tipo=bien
  cuentaContableId?: string; // required si tipo=servicio
  cantidad?: number;
  precioUnit?: number;
  monto?: number;            // required si tipo=servicio
  descuentoPct: number;
  ivaAplica: boolean;
  totalLinea: number;
}

export interface Purchase {
  id: string;
  tenantId: string;
  proveedorId: string;
  proveedor?: Proveedor;
  tipoDoc: TipoDocProveedor;
  numDocumentoProveedor: string;
  fechaDoc: string;
  fechaContable: string;
  estado: PurchaseStatus;
  lineas: PurchaseLine[];
  subtotal: number;
  iva: number;
  ivaRetenido: number;
  isrRetenido: number;
  total: number;
  formaPago: FormaPago | null;
  cuentaPagoId: string | null;
  fechaPago: string | null;
  fechaVencimiento: string | null;
  saldoPendiente: number;
  asientoId: string | null;
  createdAt: string;
  updatedAt: string;
}

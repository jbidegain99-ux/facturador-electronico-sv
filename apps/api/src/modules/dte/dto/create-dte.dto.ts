import { TipoDte, Ambiente, CondicionOperacion } from '@facturador/shared';

export class DireccionDto {
  departamento: string;
  municipio: string;
  complemento: string;
}

export class EmisorDto {
  nit: string;
  nrc: string;
  nombre: string;
  codActividad: string;
  descActividad: string;
  nombreComercial?: string;
  tipoEstablecimiento: '01' | '02' | '04' | '07' | '20';
  direccion: DireccionDto;
  telefono: string;
  correo: string;
  codEstableMH?: string;
  codEstable?: string;
  codPuntoVentaMH?: string;
  codPuntoVenta?: string;
}

export class ReceptorFacturaDto {
  tipoDocumento?: '36' | '13' | '02' | '03' | '37';
  numDocumento?: string;
  nrc?: string;
  nombre?: string;
  codActividad?: string;
  descActividad?: string;
  direccion?: DireccionDto;
  telefono?: string;
  correo?: string;
}

export class ReceptorCCFDto {
  nit: string;
  nrc: string;
  nombre: string;
  codActividad: string;
  descActividad: string;
  nombreComercial?: string;
  direccion: DireccionDto;
  telefono?: string;
  correo: string;
}

export class ItemDto {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  esGravado?: boolean;
  esExento?: boolean;
  codigo?: string;
}

export class CreateFacturaDto {
  tipoDte: '01' = '01';
  ambiente?: Ambiente;
  emisor: EmisorDto;
  receptor?: ReceptorFacturaDto;
  items: ItemDto[];
  codEstablecimiento: string;
  correlativo: number;
  condicionOperacion?: CondicionOperacion;
}

export class CreateCCFDto {
  tipoDte: '03' = '03';
  ambiente?: Ambiente;
  emisor: EmisorDto;
  receptor: ReceptorCCFDto;
  items: ItemDto[];
  codEstablecimiento: string;
  correlativo: number;
  condicionOperacion?: CondicionOperacion;
}

export class DocumentoRelacionadoDto {
  tipoDocumento: string;
  tipoGeneracion: 1 | 2;
  numeroDocumento: string;
  fechaEmision: string;
}

export class CreateNotaCreditoDto {
  tipoDte: '05' = '05';
  ambiente?: Ambiente;
  emisor: Omit<EmisorDto, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
  receptor: ReceptorCCFDto;
  documentosRelacionados: DocumentoRelacionadoDto[];
  items: ItemDto[];
  codEstablecimiento: string;
  correlativo: number;
  condicionOperacion?: CondicionOperacion;
}

export class CreateNotaDebitoDto {
  tipoDte: '06' = '06';
  ambiente?: Ambiente;
  emisor: Omit<EmisorDto, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
  receptor: ReceptorCCFDto;
  documentosRelacionados: DocumentoRelacionadoDto[];
  items: ItemDto[];
  codEstablecimiento: string;
  correlativo: number;
  condicionOperacion?: CondicionOperacion;
}

export class RetencionItemDto {
  tipoDte: string;
  tipoDoc: 1 | 2;
  numDocumento: string;
  fechaEmision: string;
  montoSujetoGrav: number;
  codigoRetencionMH: string;
  ivaRetenido: number;
  descripcion: string;
}

export class CreateComprobanteRetencionDto {
  tipoDte: '07' = '07';
  ambiente?: Ambiente;
  emisor: Omit<EmisorDto, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
  receptor: ReceptorCCFDto;
  items: RetencionItemDto[];
  codEstablecimiento: string;
  correlativo: number;
}

export class SujetoExcluidoItemDto {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  codigo?: string;
}

export class ReceptorSujetoExcluidoDto {
  tipoDocumento?: '36' | '13' | '02' | '03' | '37';
  numDocumento?: string;
  nombre: string;
  codActividad?: string;
  descActividad?: string;
  direccion: DireccionDto;
  telefono?: string;
  correo: string;
}

export class CreateSujetoExcluidoDto {
  tipoDte: '14' = '14';
  ambiente?: Ambiente;
  emisor: EmisorDto;
  sujetoExcluido: ReceptorSujetoExcluidoDto;
  items: SujetoExcluidoItemDto[];
  codEstablecimiento: string;
  correlativo: number;
  condicionOperacion?: CondicionOperacion;
}

export type CreateDteDto = CreateFacturaDto | CreateCCFDto | CreateNotaCreditoDto | CreateNotaDebitoDto | CreateComprobanteRetencionDto | CreateSujetoExcluidoDto;

export const TIPO_DTE = {
  FACTURA: '01',
  CCF: '03',
  NOTA_CREDITO: '05',
  NOTA_DEBITO: '06',
} as const;

export const AMBIENTE = {
  PRUEBAS: '00',
  PRODUCCION: '01',
} as const;

export const TIPO_DOCUMENTO_RECEPTOR = {
  NIT: '36',
  DUI: '13',
  CARNET_RESIDENTE: '02',
  PASAPORTE: '03',
  OTRO: '37',
} as const;

export const CONDICION_OPERACION = {
  CONTADO: 1,
  CREDITO: 2,
  OTRO: 3,
} as const;

export const TIPO_ITEM = {
  BIENES: 1,
  SERVICIOS: 2,
  AMBOS: 3,
  IMPUESTO: 4,
} as const;

export const TRIBUTO = {
  IVA: '20',
} as const;

export const DEPARTAMENTOS: Record<string, string> = {
  '01': 'Ahuachapan',
  '02': 'Santa Ana',
  '03': 'Sonsonate',
  '04': 'Chalatenango',
  '05': 'La Libertad',
  '06': 'San Salvador',
  '07': 'Cuscatlan',
  '08': 'La Paz',
  '09': 'Cabanas',
  '10': 'San Vicente',
  '11': 'Usulutan',
  '12': 'San Miguel',
  '13': 'Morazan',
  '14': 'La Union',
};

export const MH_ENDPOINTS = {
  AUTH: '/seguridad/auth',
  RECEPCION_DTE: '/fesv/recepciondte',
  CONSULTA_DTE: '/fesv/consultadte',
  ANULAR_DTE: '/fesv/anulardte',
  CONTINGENCIA: '/fesv/contingencia',
} as const;

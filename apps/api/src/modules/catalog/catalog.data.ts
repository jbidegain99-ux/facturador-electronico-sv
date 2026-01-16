// Catálogos del Sistema de Transmisión MH El Salvador v1.2

export interface Departamento {
  codigo: string;
  nombre: string;
}

export interface Municipio {
  codigo: string;
  nombre: string;
  departamento: string;
}

export interface ActividadEconomica {
  codigo: string;
  descripcion: string;
}

export interface TipoDocumentoIdentificacion {
  codigo: string;
  descripcion: string;
}

export interface UnidadMedida {
  codigo: number;
  descripcion: string;
}

export interface TipoEstablecimiento {
  codigo: string;
  descripcion: string;
}

export interface FormaPago {
  codigo: string;
  descripcion: string;
}

export interface CondicionOperacion {
  codigo: number;
  descripcion: string;
}

export interface TipoDte {
  codigo: string;
  descripcion: string;
}

// CAT-003: Departamentos
export const DEPARTAMENTOS: Departamento[] = [
  { codigo: '01', nombre: 'Ahuachapán' },
  { codigo: '02', nombre: 'Santa Ana' },
  { codigo: '03', nombre: 'Sonsonate' },
  { codigo: '04', nombre: 'Chalatenango' },
  { codigo: '05', nombre: 'La Libertad' },
  { codigo: '06', nombre: 'San Salvador' },
  { codigo: '07', nombre: 'Cuscatlán' },
  { codigo: '08', nombre: 'La Paz' },
  { codigo: '09', nombre: 'Cabañas' },
  { codigo: '10', nombre: 'San Vicente' },
  { codigo: '11', nombre: 'Usulután' },
  { codigo: '12', nombre: 'San Miguel' },
  { codigo: '13', nombre: 'Morazán' },
  { codigo: '14', nombre: 'La Unión' },
];

// CAT-004: Municipios (muestra parcial - principales)
export const MUNICIPIOS: Municipio[] = [
  // San Salvador (06)
  { codigo: '01', nombre: 'San Salvador', departamento: '06' },
  { codigo: '02', nombre: 'Aguilares', departamento: '06' },
  { codigo: '03', nombre: 'Apopa', departamento: '06' },
  { codigo: '04', nombre: 'Ayutuxtepeque', departamento: '06' },
  { codigo: '05', nombre: 'Cuscatancingo', departamento: '06' },
  { codigo: '06', nombre: 'Delgado', departamento: '06' },
  { codigo: '07', nombre: 'El Paisnal', departamento: '06' },
  { codigo: '08', nombre: 'Guazapa', departamento: '06' },
  { codigo: '09', nombre: 'Ilopango', departamento: '06' },
  { codigo: '10', nombre: 'Mejicanos', departamento: '06' },
  { codigo: '11', nombre: 'Nejapa', departamento: '06' },
  { codigo: '12', nombre: 'Panchimalco', departamento: '06' },
  { codigo: '13', nombre: 'Rosario de Mora', departamento: '06' },
  { codigo: '14', nombre: 'San Marcos', departamento: '06' },
  { codigo: '15', nombre: 'San Martín', departamento: '06' },
  { codigo: '16', nombre: 'Santiago Texacuangos', departamento: '06' },
  { codigo: '17', nombre: 'Santo Tomás', departamento: '06' },
  { codigo: '18', nombre: 'Soyapango', departamento: '06' },
  { codigo: '19', nombre: 'Tonacatepeque', departamento: '06' },
  // La Libertad (05)
  { codigo: '01', nombre: 'Antiguo Cuscatlán', departamento: '05' },
  { codigo: '02', nombre: 'Ciudad Arce', departamento: '05' },
  { codigo: '03', nombre: 'Colón', departamento: '05' },
  { codigo: '04', nombre: 'Comasagua', departamento: '05' },
  { codigo: '05', nombre: 'Chiltiupán', departamento: '05' },
  { codigo: '06', nombre: 'Huizúcar', departamento: '05' },
  { codigo: '07', nombre: 'Jayaque', departamento: '05' },
  { codigo: '08', nombre: 'Jicalapa', departamento: '05' },
  { codigo: '09', nombre: 'La Libertad', departamento: '05' },
  { codigo: '10', nombre: 'Santa Tecla', departamento: '05' },
  { codigo: '11', nombre: 'Nuevo Cuscatlán', departamento: '05' },
  { codigo: '12', nombre: 'San Juan Opico', departamento: '05' },
  { codigo: '13', nombre: 'Quezaltepeque', departamento: '05' },
  { codigo: '14', nombre: 'Sacacoyo', departamento: '05' },
  { codigo: '15', nombre: 'San José Villanueva', departamento: '05' },
  { codigo: '16', nombre: 'San Matías', departamento: '05' },
  { codigo: '17', nombre: 'San Pablo Tacachico', departamento: '05' },
  { codigo: '18', nombre: 'Talnique', departamento: '05' },
  { codigo: '19', nombre: 'Tamanique', departamento: '05' },
  { codigo: '20', nombre: 'Teotepeque', departamento: '05' },
  { codigo: '21', nombre: 'Tepecoyo', departamento: '05' },
  { codigo: '22', nombre: 'Zaragoza', departamento: '05' },
];

// CAT-022: Tipos de Documento de Identificación
export const TIPOS_DOCUMENTO_IDENTIFICACION: TipoDocumentoIdentificacion[] = [
  { codigo: '36', descripcion: 'NIT' },
  { codigo: '13', descripcion: 'DUI' },
  { codigo: '02', descripcion: 'Carnet de Residente' },
  { codigo: '03', descripcion: 'Pasaporte' },
  { codigo: '37', descripcion: 'Otro' },
];

// CAT-014: Unidades de Medida
export const UNIDADES_MEDIDA: UnidadMedida[] = [
  { codigo: 1, descripcion: 'Metro' },
  { codigo: 2, descripcion: 'Yarda' },
  { codigo: 3, descripcion: 'Vara' },
  { codigo: 4, descripcion: 'Pie' },
  { codigo: 5, descripcion: 'Pulgada' },
  { codigo: 6, descripcion: 'Milímetro' },
  { codigo: 7, descripcion: 'Centímetro' },
  { codigo: 8, descripcion: 'Kilómetro' },
  { codigo: 9, descripcion: 'Milla' },
  { codigo: 10, descripcion: 'Metro Cuadrado' },
  { codigo: 11, descripcion: 'Hectárea' },
  { codigo: 12, descripcion: 'Manzana' },
  { codigo: 13, descripcion: 'Vara Cuadrada' },
  { codigo: 14, descripcion: 'Pie Cuadrado' },
  { codigo: 15, descripcion: 'Metro Cúbico' },
  { codigo: 16, descripcion: 'Litro' },
  { codigo: 17, descripcion: 'Centímetro Cúbico' },
  { codigo: 18, descripcion: 'Barril' },
  { codigo: 19, descripcion: 'Galón' },
  { codigo: 20, descripcion: 'Botella' },
  { codigo: 21, descripcion: 'Kilogramo' },
  { codigo: 22, descripcion: 'Gramo' },
  { codigo: 23, descripcion: 'Libra' },
  { codigo: 24, descripcion: 'Onza' },
  { codigo: 25, descripcion: 'Quintal' },
  { codigo: 26, descripcion: 'Tonelada Métrica' },
  { codigo: 27, descripcion: 'Tonelada Corta' },
  { codigo: 28, descripcion: 'Tonelada Larga' },
  { codigo: 29, descripcion: 'Caja' },
  { codigo: 30, descripcion: 'Fardo' },
  { codigo: 31, descripcion: 'Bolsa' },
  { codigo: 32, descripcion: 'Paquete' },
  { codigo: 33, descripcion: 'Rollo' },
  { codigo: 34, descripcion: 'Docena' },
  { codigo: 35, descripcion: 'Ciento' },
  { codigo: 36, descripcion: 'Millar' },
  { codigo: 37, descripcion: 'Otro' },
  { codigo: 38, descripcion: 'Juego' },
  { codigo: 39, descripcion: 'Par' },
  { codigo: 40, descripcion: 'Pieza' },
  { codigo: 41, descripcion: 'Resma' },
  { codigo: 42, descripcion: 'Sobre' },
  { codigo: 43, descripcion: 'Lata' },
  { codigo: 44, descripcion: 'Bote' },
  { codigo: 45, descripcion: 'Frasco' },
  { codigo: 46, descripcion: 'Media' },
  { codigo: 47, descripcion: 'Cartón' },
  { codigo: 48, descripcion: 'Block' },
  { codigo: 49, descripcion: 'Segundo' },
  { codigo: 50, descripcion: 'Minuto' },
  { codigo: 51, descripcion: 'Hora' },
  { codigo: 52, descripcion: 'Día' },
  { codigo: 53, descripcion: 'Semana' },
  { codigo: 54, descripcion: 'Quincena' },
  { codigo: 55, descripcion: 'Mes' },
  { codigo: 56, descripcion: 'Año' },
  { codigo: 57, descripcion: 'Servicio' },
  { codigo: 58, descripcion: 'Actividad' },
  { codigo: 59, descripcion: 'Unidad' },
  { codigo: 99, descripcion: 'Otra' },
];

// CAT-011: Tipo de Establecimiento
export const TIPOS_ESTABLECIMIENTO: TipoEstablecimiento[] = [
  { codigo: '01', descripcion: 'Sucursal/Agencia' },
  { codigo: '02', descripcion: 'Casa Matriz' },
  { codigo: '04', descripcion: 'Bodega' },
  { codigo: '07', descripcion: 'Predio/Local de Terceros' },
  { codigo: '20', descripcion: 'Otro' },
];

// CAT-017: Formas de Pago
export const FORMAS_PAGO: FormaPago[] = [
  { codigo: '01', descripcion: 'Billetes y monedas' },
  { codigo: '02', descripcion: 'Tarjeta de Débito' },
  { codigo: '03', descripcion: 'Tarjeta de Crédito' },
  { codigo: '04', descripcion: 'Cheque' },
  { codigo: '05', descripcion: 'Transferencia Depósito Bancario' },
  { codigo: '06', descripcion: 'Vales' },
  { codigo: '07', descripcion: 'Pagos con Bitcoin' },
  { codigo: '08', descripcion: 'Tarjeta Prepagada' },
  { codigo: '09', descripcion: 'Tarjeta Regalo' },
  { codigo: '10', descripcion: 'Dinero Electrónico' },
  { codigo: '11', descripcion: 'Giro Postal' },
  { codigo: '12', descripcion: 'Giro Bancario' },
  { codigo: '13', descripcion: 'Letra de Cambio' },
  { codigo: '14', descripcion: 'Otros' },
  { codigo: '99', descripcion: 'Otros' },
];

// CAT-016: Condición de la Operación
export const CONDICIONES_OPERACION: CondicionOperacion[] = [
  { codigo: 1, descripcion: 'Contado' },
  { codigo: 2, descripcion: 'A crédito' },
  { codigo: 3, descripcion: 'Otro' },
];

// CAT-002: Tipos de DTE
export const TIPOS_DTE: TipoDte[] = [
  { codigo: '01', descripcion: 'Factura' },
  { codigo: '03', descripcion: 'Comprobante de Crédito Fiscal' },
  { codigo: '04', descripcion: 'Nota de Remisión' },
  { codigo: '05', descripcion: 'Nota de Crédito' },
  { codigo: '06', descripcion: 'Nota de Débito' },
  { codigo: '07', descripcion: 'Comprobante de Retención' },
  { codigo: '08', descripcion: 'Comprobante de Liquidación' },
  { codigo: '09', descripcion: 'Documento Contable de Liquidación' },
  { codigo: '11', descripcion: 'Factura de Exportación' },
  { codigo: '14', descripcion: 'Factura de Sujeto Excluido' },
  { codigo: '15', descripcion: 'Comprobante de Donación' },
];

// Algunas actividades económicas comunes
export const ACTIVIDADES_ECONOMICAS: ActividadEconomica[] = [
  { codigo: '10111', descripcion: 'Cultivo de cereales excepto arroz y forrajeros' },
  { codigo: '46100', descripcion: 'Venta al por mayor a cambio de una retribución o por contrata' },
  { codigo: '46210', descripcion: 'Venta al por mayor de materias primas agropecuarias' },
  { codigo: '47111', descripcion: 'Venta al por menor en supermercados con predominio de alimentos' },
  { codigo: '47190', descripcion: 'Otras actividades de venta al por menor en comercios no especializados' },
  { codigo: '47211', descripcion: 'Venta al por menor de frutas y verduras frescas' },
  { codigo: '47520', descripcion: 'Venta al por menor de artículos de ferretería' },
  { codigo: '47610', descripcion: 'Venta al por menor de libros, periódicos y artículos de papelería' },
  { codigo: '49111', descripcion: 'Transporte interurbano de pasajeros por ferrocarril' },
  { codigo: '55101', descripcion: 'Actividades de hoteles' },
  { codigo: '56101', descripcion: 'Actividades de restaurantes' },
  { codigo: '62010', descripcion: 'Actividades de programación informática' },
  { codigo: '62020', descripcion: 'Actividades de consultoría de informática' },
  { codigo: '62090', descripcion: 'Otras actividades de tecnología de la información' },
  { codigo: '69100', descripcion: 'Actividades jurídicas' },
  { codigo: '69200', descripcion: 'Actividades de contabilidad' },
  { codigo: '70100', descripcion: 'Actividades de oficinas principales' },
  { codigo: '70200', descripcion: 'Actividades de consultoría de gestión' },
  { codigo: '73100', descripcion: 'Publicidad' },
  { codigo: '74100', descripcion: 'Actividades especializadas de diseño' },
  { codigo: '86101', descripcion: 'Actividades de hospitales' },
  { codigo: '86201', descripcion: 'Actividades de médicos y odontólogos' },
  { codigo: '85100', descripcion: 'Enseñanza preescolar y primaria' },
  { codigo: '85210', descripcion: 'Enseñanza secundaria de formación general' },
];

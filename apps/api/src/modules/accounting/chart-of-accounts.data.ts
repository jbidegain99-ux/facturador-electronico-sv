/**
 * Plan de cuentas estándar de El Salvador basado en NIIF PYMES.
 * Hierarchy: level 1 (Elemento) → 2 (Rubro) → 3 (Cuenta) → 4 (Subcuenta)
 */

export interface ChartOfAccountEntry {
  code: string;
  name: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  normalBalance: 'DEBIT' | 'CREDIT';
  level: number;
  parentCode?: string;
  allowsPosting: boolean;
}

export const EL_SALVADOR_CHART_OF_ACCOUNTS: ChartOfAccountEntry[] = [
  // ============================================================
  // 1. ACTIVOS
  // ============================================================
  { code: '1', name: 'ACTIVOS', accountType: 'ASSET', level: 1, normalBalance: 'DEBIT', allowsPosting: false },

  { code: '11', name: 'ACTIVO CORRIENTE', accountType: 'ASSET', level: 2, parentCode: '1', normalBalance: 'DEBIT', allowsPosting: false },

  { code: '1101', name: 'EFECTIVO Y EQUIVALENTES', accountType: 'ASSET', level: 3, parentCode: '11', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '110101', name: 'Caja General', accountType: 'ASSET', level: 4, parentCode: '1101', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110102', name: 'Caja Chica', accountType: 'ASSET', level: 4, parentCode: '1101', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110103', name: 'Bancos', accountType: 'ASSET', level: 4, parentCode: '1101', normalBalance: 'DEBIT', allowsPosting: true },

  { code: '1102', name: 'INVERSIONES TEMPORALES', accountType: 'ASSET', level: 3, parentCode: '11', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '110201', name: 'Depósitos a Plazo', accountType: 'ASSET', level: 4, parentCode: '1102', normalBalance: 'DEBIT', allowsPosting: true },

  { code: '1103', name: 'CUENTAS POR COBRAR', accountType: 'ASSET', level: 3, parentCode: '11', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '110301', name: 'Clientes Locales', accountType: 'ASSET', level: 4, parentCode: '1103', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110302', name: 'Provisión Cuentas Incobrables', accountType: 'ASSET', level: 4, parentCode: '1103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '110303', name: 'IVA Crédito Fiscal', accountType: 'ASSET', level: 4, parentCode: '1103', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110304', name: 'Anticipos a Proveedores', accountType: 'ASSET', level: 4, parentCode: '1103', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110305', name: 'Deudores Diversos', accountType: 'ASSET', level: 4, parentCode: '1103', normalBalance: 'DEBIT', allowsPosting: true },

  { code: '1104', name: 'INVENTARIOS', accountType: 'ASSET', level: 3, parentCode: '11', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '110401', name: 'Mercadería', accountType: 'ASSET', level: 4, parentCode: '1104', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110402', name: 'Productos en Proceso', accountType: 'ASSET', level: 4, parentCode: '1104', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110403', name: 'Productos Terminados', accountType: 'ASSET', level: 4, parentCode: '1104', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110404', name: 'Materia Prima', accountType: 'ASSET', level: 4, parentCode: '1104', normalBalance: 'DEBIT', allowsPosting: true },

  { code: '1105', name: 'PAGOS ANTICIPADOS', accountType: 'ASSET', level: 3, parentCode: '11', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '110501', name: 'Seguros Pagados por Anticipado', accountType: 'ASSET', level: 4, parentCode: '1105', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '110502', name: 'Alquileres Pagados por Anticipado', accountType: 'ASSET', level: 4, parentCode: '1105', normalBalance: 'DEBIT', allowsPosting: true },

  { code: '12', name: 'ACTIVO NO CORRIENTE', accountType: 'ASSET', level: 2, parentCode: '1', normalBalance: 'DEBIT', allowsPosting: false },

  { code: '1201', name: 'PROPIEDADES, PLANTA Y EQUIPO', accountType: 'ASSET', level: 3, parentCode: '12', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '120101', name: 'Terrenos', accountType: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '120102', name: 'Edificios', accountType: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '120103', name: 'Vehículos', accountType: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '120104', name: 'Equipo de Cómputo', accountType: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '120105', name: 'Mobiliario y Equipo de Oficina', accountType: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '120106', name: 'Herramientas', accountType: 'ASSET', level: 4, parentCode: '1201', normalBalance: 'DEBIT', allowsPosting: true },

  { code: '1202', name: 'DEPRECIACIÓN ACUMULADA', accountType: 'ASSET', level: 3, parentCode: '12', normalBalance: 'CREDIT', allowsPosting: false },
  { code: '120201', name: 'Depreciación Acumulada Edificios', accountType: 'ASSET', level: 4, parentCode: '1202', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '120202', name: 'Depreciación Acumulada Vehículos', accountType: 'ASSET', level: 4, parentCode: '1202', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '120203', name: 'Depreciación Acumulada Equipo Cómputo', accountType: 'ASSET', level: 4, parentCode: '1202', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '120204', name: 'Depreciación Acumulada Mob. y Equipo', accountType: 'ASSET', level: 4, parentCode: '1202', normalBalance: 'CREDIT', allowsPosting: true },

  { code: '1203', name: 'INTANGIBLES', accountType: 'ASSET', level: 3, parentCode: '12', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '120301', name: 'Software y Licencias', accountType: 'ASSET', level: 4, parentCode: '1203', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '120302', name: 'Amortización Acumulada', accountType: 'ASSET', level: 4, parentCode: '1203', normalBalance: 'CREDIT', allowsPosting: true },

  // ============================================================
  // 2. PASIVOS
  // ============================================================
  { code: '2', name: 'PASIVOS', accountType: 'LIABILITY', level: 1, normalBalance: 'CREDIT', allowsPosting: false },

  { code: '21', name: 'PASIVO CORRIENTE', accountType: 'LIABILITY', level: 2, parentCode: '2', normalBalance: 'CREDIT', allowsPosting: false },

  { code: '2101', name: 'CUENTAS POR PAGAR', accountType: 'LIABILITY', level: 3, parentCode: '21', normalBalance: 'CREDIT', allowsPosting: false },
  { code: '210101', name: 'Proveedores', accountType: 'LIABILITY', level: 4, parentCode: '2101', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210102', name: 'Acreedores Diversos', accountType: 'LIABILITY', level: 4, parentCode: '2101', normalBalance: 'CREDIT', allowsPosting: true },

  { code: '2102', name: 'OBLIGACIONES FISCALES', accountType: 'LIABILITY', level: 3, parentCode: '21', normalBalance: 'CREDIT', allowsPosting: false },
  { code: '210201', name: 'IVA Débito Fiscal', accountType: 'LIABILITY', level: 4, parentCode: '2102', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210202', name: 'Retenciones de Renta', accountType: 'LIABILITY', level: 4, parentCode: '2102', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210203', name: 'Pago a Cuenta', accountType: 'LIABILITY', level: 4, parentCode: '2102', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210204', name: 'IVA Percibido', accountType: 'LIABILITY', level: 4, parentCode: '2102', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210205', name: 'IVA Retenido', accountType: 'LIABILITY', level: 4, parentCode: '2102', normalBalance: 'CREDIT', allowsPosting: true },

  { code: '2103', name: 'OBLIGACIONES LABORALES', accountType: 'LIABILITY', level: 3, parentCode: '21', normalBalance: 'CREDIT', allowsPosting: false },
  { code: '210301', name: 'Sueldos por Pagar', accountType: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210302', name: 'Vacaciones por Pagar', accountType: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210303', name: 'Aguinaldo por Pagar', accountType: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210304', name: 'ISSS por Pagar', accountType: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210305', name: 'AFP por Pagar', accountType: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '210306', name: 'INSAFORP por Pagar', accountType: 'LIABILITY', level: 4, parentCode: '2103', normalBalance: 'CREDIT', allowsPosting: true },

  { code: '2104', name: 'PRÉSTAMOS A CORTO PLAZO', accountType: 'LIABILITY', level: 3, parentCode: '21', normalBalance: 'CREDIT', allowsPosting: false },
  { code: '210401', name: 'Préstamos Bancarios C/P', accountType: 'LIABILITY', level: 4, parentCode: '2104', normalBalance: 'CREDIT', allowsPosting: true },

  { code: '22', name: 'PASIVO NO CORRIENTE', accountType: 'LIABILITY', level: 2, parentCode: '2', normalBalance: 'CREDIT', allowsPosting: false },
  { code: '2201', name: 'PRÉSTAMOS A LARGO PLAZO', accountType: 'LIABILITY', level: 3, parentCode: '22', normalBalance: 'CREDIT', allowsPosting: false },
  { code: '220101', name: 'Préstamos Bancarios L/P', accountType: 'LIABILITY', level: 4, parentCode: '2201', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '220102', name: 'Préstamos Hipotecarios', accountType: 'LIABILITY', level: 4, parentCode: '2201', normalBalance: 'CREDIT', allowsPosting: true },

  // ============================================================
  // 3. PATRIMONIO
  // ============================================================
  { code: '3', name: 'PATRIMONIO', accountType: 'EQUITY', level: 1, normalBalance: 'CREDIT', allowsPosting: false },

  { code: '31', name: 'CAPITAL SOCIAL', accountType: 'EQUITY', level: 2, parentCode: '3', normalBalance: 'CREDIT', allowsPosting: false },
  { code: '3101', name: 'Capital Autorizado', accountType: 'EQUITY', level: 3, parentCode: '31', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '3102', name: 'Reserva Legal', accountType: 'EQUITY', level: 3, parentCode: '31', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '3103', name: 'Utilidades Retenidas', accountType: 'EQUITY', level: 3, parentCode: '31', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '3104', name: 'Utilidad del Ejercicio', accountType: 'EQUITY', level: 3, parentCode: '31', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '3105', name: 'Pérdidas Acumuladas', accountType: 'EQUITY', level: 3, parentCode: '31', normalBalance: 'DEBIT', allowsPosting: true },

  // ============================================================
  // 4. INGRESOS
  // ============================================================
  { code: '4', name: 'INGRESOS', accountType: 'INCOME', level: 1, normalBalance: 'CREDIT', allowsPosting: false },

  { code: '41', name: 'INGRESOS OPERACIONALES', accountType: 'INCOME', level: 2, parentCode: '4', normalBalance: 'CREDIT', allowsPosting: false },
  { code: '4101', name: 'Ventas', accountType: 'INCOME', level: 3, parentCode: '41', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '4102', name: 'Servicios', accountType: 'INCOME', level: 3, parentCode: '41', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '4103', name: 'Descuentos sobre Ventas', accountType: 'INCOME', level: 3, parentCode: '41', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '4104', name: 'Devoluciones sobre Ventas', accountType: 'INCOME', level: 3, parentCode: '41', normalBalance: 'DEBIT', allowsPosting: true },

  { code: '42', name: 'INGRESOS NO OPERACIONALES', accountType: 'INCOME', level: 2, parentCode: '4', normalBalance: 'CREDIT', allowsPosting: false },
  { code: '4201', name: 'Ingresos Financieros', accountType: 'INCOME', level: 3, parentCode: '42', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '4202', name: 'Otros Ingresos', accountType: 'INCOME', level: 3, parentCode: '42', normalBalance: 'CREDIT', allowsPosting: true },
  { code: '4203', name: 'Ganancia en Venta de Activos', accountType: 'INCOME', level: 3, parentCode: '42', normalBalance: 'CREDIT', allowsPosting: true },

  // ============================================================
  // 5. GASTOS
  // ============================================================
  { code: '5', name: 'GASTOS', accountType: 'EXPENSE', level: 1, normalBalance: 'DEBIT', allowsPosting: false },

  { code: '51', name: 'COSTO DE VENTAS', accountType: 'EXPENSE', level: 2, parentCode: '5', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '5101', name: 'Costo de Mercadería Vendida', accountType: 'EXPENSE', level: 3, parentCode: '51', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5102', name: 'Costo de Servicios', accountType: 'EXPENSE', level: 3, parentCode: '51', normalBalance: 'DEBIT', allowsPosting: true },

  { code: '52', name: 'GASTOS OPERACIONALES', accountType: 'EXPENSE', level: 2, parentCode: '5', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '5201', name: 'Sueldos y Salarios', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5202', name: 'Prestaciones Sociales', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5203', name: 'Alquileres', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5204', name: 'Servicios Básicos', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5205', name: 'Depreciación', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5206', name: 'Combustibles y Lubricantes', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5207', name: 'Papelería y Útiles', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5208', name: 'Mantenimiento y Reparaciones', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5209', name: 'Seguros', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5210', name: 'Impuestos Municipales', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5211', name: 'Honorarios Profesionales', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5212', name: 'Publicidad y Propaganda', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5213', name: 'Viáticos y Transporte', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5214', name: 'Gastos de Representación', accountType: 'EXPENSE', level: 3, parentCode: '52', normalBalance: 'DEBIT', allowsPosting: true },

  { code: '53', name: 'GASTOS FINANCIEROS', accountType: 'EXPENSE', level: 2, parentCode: '5', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '5301', name: 'Intereses Pagados', accountType: 'EXPENSE', level: 3, parentCode: '53', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5302', name: 'Comisiones Bancarias', accountType: 'EXPENSE', level: 3, parentCode: '53', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5303', name: 'Pérdida en Cambio', accountType: 'EXPENSE', level: 3, parentCode: '53', normalBalance: 'DEBIT', allowsPosting: true },

  { code: '54', name: 'GASTOS NO DEDUCIBLES', accountType: 'EXPENSE', level: 2, parentCode: '5', normalBalance: 'DEBIT', allowsPosting: false },
  { code: '5401', name: 'Multas y Recargos', accountType: 'EXPENSE', level: 3, parentCode: '54', normalBalance: 'DEBIT', allowsPosting: true },
  { code: '5402', name: 'Donaciones', accountType: 'EXPENSE', level: 3, parentCode: '54', normalBalance: 'DEBIT', allowsPosting: true },
];

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
export declare const DEPARTAMENTOS: Departamento[];
export declare const MUNICIPIOS: Municipio[];
export declare const TIPOS_DOCUMENTO_IDENTIFICACION: TipoDocumentoIdentificacion[];
export declare const UNIDADES_MEDIDA: UnidadMedida[];
export declare const TIPOS_ESTABLECIMIENTO: TipoEstablecimiento[];
export declare const FORMAS_PAGO: FormaPago[];
export declare const CONDICIONES_OPERACION: CondicionOperacion[];
export declare const TIPOS_DTE: TipoDte[];
export declare const ACTIVIDADES_ECONOMICAS: ActividadEconomica[];
//# sourceMappingURL=catalog.data.d.ts.map
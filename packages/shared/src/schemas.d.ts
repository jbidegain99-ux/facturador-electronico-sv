import { z } from 'zod';
export declare const direccionSchema: z.ZodObject<{
    departamento: z.ZodString;
    municipio: z.ZodString;
    complemento: z.ZodString;
}, "strip", z.ZodTypeAny, {
    departamento: string;
    municipio: string;
    complemento: string;
}, {
    departamento: string;
    municipio: string;
    complemento: string;
}>;
export declare const emisorSchema: z.ZodObject<{
    nit: z.ZodString;
    nrc: z.ZodString;
    nombre: z.ZodString;
    codActividad: z.ZodString;
    descActividad: z.ZodString;
    nombreComercial: z.ZodNullable<z.ZodString>;
    tipoEstablecimiento: z.ZodEnum<["01", "02", "04", "07", "20"]>;
    direccion: z.ZodObject<{
        departamento: z.ZodString;
        municipio: z.ZodString;
        complemento: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        departamento: string;
        municipio: string;
        complemento: string;
    }, {
        departamento: string;
        municipio: string;
        complemento: string;
    }>;
    telefono: z.ZodString;
    correo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    nit: string;
    nrc: string;
    descActividad: string;
    telefono: string;
    correo: string;
    nombreComercial: string | null;
    direccion: {
        departamento: string;
        municipio: string;
        complemento: string;
    };
    codActividad: string;
    tipoEstablecimiento: "01" | "07" | "20" | "02" | "04";
}, {
    nombre: string;
    nit: string;
    nrc: string;
    descActividad: string;
    telefono: string;
    correo: string;
    nombreComercial: string | null;
    direccion: {
        departamento: string;
        municipio: string;
        complemento: string;
    };
    codActividad: string;
    tipoEstablecimiento: "01" | "07" | "20" | "02" | "04";
}>;
export declare const receptorCCFSchema: z.ZodObject<{
    nit: z.ZodString;
    nrc: z.ZodString;
    nombre: z.ZodString;
    codActividad: z.ZodString;
    descActividad: z.ZodString;
    nombreComercial: z.ZodNullable<z.ZodString>;
    direccion: z.ZodObject<{
        departamento: z.ZodString;
        municipio: z.ZodString;
        complemento: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        departamento: string;
        municipio: string;
        complemento: string;
    }, {
        departamento: string;
        municipio: string;
        complemento: string;
    }>;
    telefono: z.ZodNullable<z.ZodString>;
    correo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    nit: string;
    nrc: string;
    descActividad: string;
    telefono: string | null;
    correo: string;
    nombreComercial: string | null;
    direccion: {
        departamento: string;
        municipio: string;
        complemento: string;
    };
    codActividad: string;
}, {
    nombre: string;
    nit: string;
    nrc: string;
    descActividad: string;
    telefono: string | null;
    correo: string;
    nombreComercial: string | null;
    direccion: {
        departamento: string;
        municipio: string;
        complemento: string;
    };
    codActividad: string;
}>;
export declare const receptorFCSchema: z.ZodObject<{
    tipoDocumento: z.ZodNullable<z.ZodEnum<["36", "13", "02", "03", "37"]>>;
    numDocumento: z.ZodNullable<z.ZodString>;
    nrc: z.ZodNullable<z.ZodString>;
    nombre: z.ZodNullable<z.ZodString>;
    codActividad: z.ZodNullable<z.ZodString>;
    descActividad: z.ZodNullable<z.ZodString>;
    direccion: z.ZodNullable<z.ZodObject<{
        departamento: z.ZodString;
        municipio: z.ZodString;
        complemento: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        departamento: string;
        municipio: string;
        complemento: string;
    }, {
        departamento: string;
        municipio: string;
        complemento: string;
    }>>;
    telefono: z.ZodNullable<z.ZodString>;
    correo: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nombre: string | null;
    nrc: string | null;
    descActividad: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: {
        departamento: string;
        municipio: string;
        complemento: string;
    } | null;
    tipoDocumento: "36" | "13" | "03" | "02" | "37" | null;
    numDocumento: string | null;
    codActividad: string | null;
}, {
    nombre: string | null;
    nrc: string | null;
    descActividad: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: {
        departamento: string;
        municipio: string;
        complemento: string;
    } | null;
    tipoDocumento: "36" | "13" | "03" | "02" | "37" | null;
    numDocumento: string | null;
    codActividad: string | null;
}>;
export declare const cuerpoDocumentoItemSchema: z.ZodObject<{
    numItem: z.ZodNumber;
    tipoItem: z.ZodNumber;
    cantidad: z.ZodNumber;
    codigo: z.ZodNullable<z.ZodString>;
    uniMedida: z.ZodNumber;
    descripcion: z.ZodString;
    precioUni: z.ZodNumber;
    montoDescu: z.ZodNumber;
    ventaNoSuj: z.ZodNumber;
    ventaExenta: z.ZodNumber;
    ventaGravada: z.ZodNumber;
    tributos: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    numItem: number;
    tipoItem: number;
    cantidad: number;
    codigo: string | null;
    uniMedida: number;
    descripcion: string;
    precioUni: number;
    montoDescu: number;
    ventaNoSuj: number;
    ventaExenta: number;
    ventaGravada: number;
    tributos: string[] | null;
}, {
    numItem: number;
    tipoItem: number;
    cantidad: number;
    codigo: string | null;
    uniMedida: number;
    descripcion: string;
    precioUni: number;
    montoDescu: number;
    ventaNoSuj: number;
    ventaExenta: number;
    ventaGravada: number;
    tributos: string[] | null;
}>;
export declare const resumenTributoSchema: z.ZodObject<{
    codigo: z.ZodString;
    descripcion: z.ZodString;
    valor: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    codigo: string;
    descripcion: string;
    valor: number;
}, {
    codigo: string;
    descripcion: string;
    valor: number;
}>;
export declare const resumenSchema: z.ZodObject<{
    totalNoSuj: z.ZodNumber;
    totalExenta: z.ZodNumber;
    totalGravada: z.ZodNumber;
    subTotalVentas: z.ZodNumber;
    descuNoSuj: z.ZodNumber;
    descuExenta: z.ZodNumber;
    descuGravada: z.ZodNumber;
    totalDescu: z.ZodNumber;
    tributos: z.ZodNullable<z.ZodArray<z.ZodObject<{
        codigo: z.ZodString;
        descripcion: z.ZodString;
        valor: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        codigo: string;
        descripcion: string;
        valor: number;
    }, {
        codigo: string;
        descripcion: string;
        valor: number;
    }>, "many">>;
    subTotal: z.ZodNumber;
    montoTotalOperacion: z.ZodNumber;
    totalLetras: z.ZodString;
    condicionOperacion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalGravada: number;
    tributos: {
        codigo: string;
        descripcion: string;
        valor: number;
    }[] | null;
    totalNoSuj: number;
    totalExenta: number;
    subTotalVentas: number;
    descuNoSuj: number;
    descuExenta: number;
    descuGravada: number;
    totalDescu: number;
    subTotal: number;
    montoTotalOperacion: number;
    totalLetras: string;
    condicionOperacion: number;
}, {
    totalGravada: number;
    tributos: {
        codigo: string;
        descripcion: string;
        valor: number;
    }[] | null;
    totalNoSuj: number;
    totalExenta: number;
    subTotalVentas: number;
    descuNoSuj: number;
    descuExenta: number;
    descuGravada: number;
    totalDescu: number;
    subTotal: number;
    montoTotalOperacion: number;
    totalLetras: string;
    condicionOperacion: number;
}>;
export declare const identificacionSchema: z.ZodObject<{
    version: z.ZodNumber;
    ambiente: z.ZodEnum<["00", "01"]>;
    tipoDte: z.ZodEnum<["01", "03", "05", "06"]>;
    numeroControl: z.ZodString;
    codigoGeneracion: z.ZodString;
    tipoModelo: z.ZodNumber;
    tipoOperacion: z.ZodNumber;
    tipoContingencia: z.ZodNullable<z.ZodNumber>;
    motivoContin: z.ZodNullable<z.ZodString>;
    fecEmi: z.ZodString;
    horEmi: z.ZodString;
    tipoMoneda: z.ZodLiteral<"USD">;
}, "strip", z.ZodTypeAny, {
    tipoDte: "06" | "01" | "03" | "05";
    codigoGeneracion: string;
    numeroControl: string;
    version: number;
    ambiente: "00" | "01";
    tipoModelo: number;
    tipoOperacion: number;
    tipoContingencia: number | null;
    motivoContin: string | null;
    fecEmi: string;
    horEmi: string;
    tipoMoneda: "USD";
}, {
    tipoDte: "06" | "01" | "03" | "05";
    codigoGeneracion: string;
    numeroControl: string;
    version: number;
    ambiente: "00" | "01";
    tipoModelo: number;
    tipoOperacion: number;
    tipoContingencia: number | null;
    motivoContin: string | null;
    fecEmi: string;
    horEmi: string;
    tipoMoneda: "USD";
}>;
export declare const extensionSchema: z.ZodNullable<z.ZodObject<{
    nombEntrega: z.ZodNullable<z.ZodString>;
    docuEntrega: z.ZodNullable<z.ZodString>;
    nombRecibe: z.ZodNullable<z.ZodString>;
    docuRecibe: z.ZodNullable<z.ZodString>;
    observaciones: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    observaciones: string | null;
    nombEntrega: string | null;
    docuEntrega: string | null;
    nombRecibe: string | null;
    docuRecibe: string | null;
}, {
    observaciones: string | null;
    nombEntrega: string | null;
    docuEntrega: string | null;
    nombRecibe: string | null;
    docuRecibe: string | null;
}>>;
export declare const apendiceSchema: z.ZodObject<{
    campo: z.ZodString;
    etiqueta: z.ZodString;
    valor: z.ZodString;
}, "strip", z.ZodTypeAny, {
    valor: string;
    campo: string;
    etiqueta: string;
}, {
    valor: string;
    campo: string;
    etiqueta: string;
}>;
//# sourceMappingURL=schemas.d.ts.map
export declare const TIPO_DTE: {
    readonly FACTURA: "01";
    readonly CCF: "03";
    readonly NOTA_CREDITO: "05";
    readonly NOTA_DEBITO: "06";
};
export declare const AMBIENTE: {
    readonly PRUEBAS: "00";
    readonly PRODUCCION: "01";
};
export declare const TIPO_DOCUMENTO_RECEPTOR: {
    readonly NIT: "36";
    readonly DUI: "13";
    readonly CARNET_RESIDENTE: "02";
    readonly PASAPORTE: "03";
    readonly OTRO: "37";
};
export declare const CONDICION_OPERACION: {
    readonly CONTADO: 1;
    readonly CREDITO: 2;
    readonly OTRO: 3;
};
export declare const TIPO_ITEM: {
    readonly BIENES: 1;
    readonly SERVICIOS: 2;
    readonly AMBOS: 3;
    readonly IMPUESTO: 4;
};
export declare const TRIBUTO: {
    readonly IVA: "20";
};
export declare const DEPARTAMENTOS: Record<string, string>;
export declare const MH_ENDPOINTS: {
    readonly AUTH: "/seguridad/auth";
    readonly RECEPCION_DTE: "/fesv/recepciondte";
    readonly CONSULTA_DTE: "/fesv/consultadte";
    readonly ANULAR_DTE: "/fesv/anulardte";
    readonly CONTINGENCIA: "/fesv/contingencia";
};
//# sourceMappingURL=constants.d.ts.map
import { CatalogService } from './catalog.service';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    getDepartamentos(): import("./catalog.data").Departamento[];
    getDepartamento(codigo: string): import("./catalog.data").Departamento | undefined;
    getMunicipios(departamento?: string): import("./catalog.data").Municipio[];
    getTiposDocumento(): import("./catalog.data").TipoDocumentoIdentificacion[];
    getUnidadesMedida(): import("./catalog.data").UnidadMedida[];
    getTiposEstablecimiento(): import("./catalog.data").TipoEstablecimiento[];
    getFormasPago(): import("./catalog.data").FormaPago[];
    getCondicionesOperacion(): import("./catalog.data").CondicionOperacion[];
    getTiposDte(): import("./catalog.data").TipoDte[];
    getActividadesEconomicas(query?: string): import("./catalog.data").ActividadEconomica[];
    getActividadEconomica(codigo: string): import("./catalog.data").ActividadEconomica | undefined;
}
//# sourceMappingURL=catalog.controller.d.ts.map
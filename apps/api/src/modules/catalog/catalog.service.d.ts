import { Departamento, Municipio, ActividadEconomica, TipoDocumentoIdentificacion, UnidadMedida, TipoEstablecimiento, FormaPago, CondicionOperacion, TipoDte } from './catalog.data';
export declare class CatalogService {
    getDepartamentos(): Departamento[];
    getDepartamento(codigo: string): Departamento | undefined;
    getMunicipios(departamento?: string): Municipio[];
    getMunicipio(codigo: string, departamento: string): Municipio | undefined;
    getTiposDocumentoIdentificacion(): TipoDocumentoIdentificacion[];
    getTipoDocumentoIdentificacion(codigo: string): TipoDocumentoIdentificacion | undefined;
    getUnidadesMedida(): UnidadMedida[];
    getUnidadMedida(codigo: number): UnidadMedida | undefined;
    getTiposEstablecimiento(): TipoEstablecimiento[];
    getTipoEstablecimiento(codigo: string): TipoEstablecimiento | undefined;
    getFormasPago(): FormaPago[];
    getFormaPago(codigo: string): FormaPago | undefined;
    getCondicionesOperacion(): CondicionOperacion[];
    getCondicionOperacion(codigo: number): CondicionOperacion | undefined;
    getTiposDte(): TipoDte[];
    getTipoDte(codigo: string): TipoDte | undefined;
    getActividadesEconomicas(): ActividadEconomica[];
    getActividadEconomica(codigo: string): ActividadEconomica | undefined;
    searchActividadesEconomicas(query: string): ActividadEconomica[];
}
//# sourceMappingURL=catalog.service.d.ts.map
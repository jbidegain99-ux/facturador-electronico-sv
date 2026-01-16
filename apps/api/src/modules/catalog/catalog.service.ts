import { Injectable } from '@nestjs/common';
import {
  DEPARTAMENTOS,
  MUNICIPIOS,
  TIPOS_DOCUMENTO_IDENTIFICACION,
  UNIDADES_MEDIDA,
  TIPOS_ESTABLECIMIENTO,
  FORMAS_PAGO,
  CONDICIONES_OPERACION,
  TIPOS_DTE,
  ACTIVIDADES_ECONOMICAS,
  Departamento,
  Municipio,
  ActividadEconomica,
  TipoDocumentoIdentificacion,
  UnidadMedida,
  TipoEstablecimiento,
  FormaPago,
  CondicionOperacion,
  TipoDte,
} from './catalog.data';

@Injectable()
export class CatalogService {
  getDepartamentos(): Departamento[] {
    return DEPARTAMENTOS;
  }

  getDepartamento(codigo: string): Departamento | undefined {
    return DEPARTAMENTOS.find((d) => d.codigo === codigo);
  }

  getMunicipios(departamento?: string): Municipio[] {
    if (departamento) {
      return MUNICIPIOS.filter((m) => m.departamento === departamento);
    }
    return MUNICIPIOS;
  }

  getMunicipio(codigo: string, departamento: string): Municipio | undefined {
    return MUNICIPIOS.find((m) => m.codigo === codigo && m.departamento === departamento);
  }

  getTiposDocumentoIdentificacion(): TipoDocumentoIdentificacion[] {
    return TIPOS_DOCUMENTO_IDENTIFICACION;
  }

  getTipoDocumentoIdentificacion(codigo: string): TipoDocumentoIdentificacion | undefined {
    return TIPOS_DOCUMENTO_IDENTIFICACION.find((t) => t.codigo === codigo);
  }

  getUnidadesMedida(): UnidadMedida[] {
    return UNIDADES_MEDIDA;
  }

  getUnidadMedida(codigo: number): UnidadMedida | undefined {
    return UNIDADES_MEDIDA.find((u) => u.codigo === codigo);
  }

  getTiposEstablecimiento(): TipoEstablecimiento[] {
    return TIPOS_ESTABLECIMIENTO;
  }

  getTipoEstablecimiento(codigo: string): TipoEstablecimiento | undefined {
    return TIPOS_ESTABLECIMIENTO.find((t) => t.codigo === codigo);
  }

  getFormasPago(): FormaPago[] {
    return FORMAS_PAGO;
  }

  getFormaPago(codigo: string): FormaPago | undefined {
    return FORMAS_PAGO.find((f) => f.codigo === codigo);
  }

  getCondicionesOperacion(): CondicionOperacion[] {
    return CONDICIONES_OPERACION;
  }

  getCondicionOperacion(codigo: number): CondicionOperacion | undefined {
    return CONDICIONES_OPERACION.find((c) => c.codigo === codigo);
  }

  getTiposDte(): TipoDte[] {
    return TIPOS_DTE;
  }

  getTipoDte(codigo: string): TipoDte | undefined {
    return TIPOS_DTE.find((t) => t.codigo === codigo);
  }

  getActividadesEconomicas(): ActividadEconomica[] {
    return ACTIVIDADES_ECONOMICAS;
  }

  getActividadEconomica(codigo: string): ActividadEconomica | undefined {
    return ACTIVIDADES_ECONOMICAS.find((a) => a.codigo === codigo);
  }

  searchActividadesEconomicas(query: string): ActividadEconomica[] {
    const lowerQuery = query.toLowerCase();
    return ACTIVIDADES_ECONOMICAS.filter(
      (a) =>
        a.codigo.includes(query) ||
        a.descripcion.toLowerCase().includes(lowerQuery)
    );
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalogs')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('departamentos')
  getDepartamentos() {
    return this.catalogService.getDepartamentos();
  }

  @Get('departamentos/:codigo')
  getDepartamento(@Param('codigo') codigo: string) {
    return this.catalogService.getDepartamento(codigo);
  }

  @Get('municipios')
  getMunicipios(@Query('departamento') departamento?: string) {
    return this.catalogService.getMunicipios(departamento);
  }

  @Get('tipos-documento')
  getTiposDocumento() {
    return this.catalogService.getTiposDocumentoIdentificacion();
  }

  @Get('unidades-medida')
  getUnidadesMedida() {
    return this.catalogService.getUnidadesMedida();
  }

  @Get('tipos-establecimiento')
  getTiposEstablecimiento() {
    return this.catalogService.getTiposEstablecimiento();
  }

  @Get('formas-pago')
  getFormasPago() {
    return this.catalogService.getFormasPago();
  }

  @Get('condiciones-operacion')
  getCondicionesOperacion() {
    return this.catalogService.getCondicionesOperacion();
  }

  @Get('tipos-dte')
  getTiposDte() {
    return this.catalogService.getTiposDte();
  }

  @Get('actividades-economicas')
  getActividadesEconomicas(@Query('q') query?: string) {
    if (query) {
      return this.catalogService.searchActividadesEconomicas(query);
    }
    return this.catalogService.getActividadesEconomicas();
  }

  @Get('actividades-economicas/:codigo')
  getActividadEconomica(@Param('codigo') codigo: string) {
    return this.catalogService.getActividadEconomica(codigo);
  }
}

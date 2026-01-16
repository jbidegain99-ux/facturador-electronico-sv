import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  @Get('tipo-documento')
  @ApiOperation({ summary: 'Tipos de documento de identificacion' })
  getTipoDocumento() {
    return [
      { codigo: '36', descripcion: 'NIT' },
      { codigo: '13', descripcion: 'DUI' },
      { codigo: '02', descripcion: 'Carnet de Residente' },
      { codigo: '03', descripcion: 'Pasaporte' },
      { codigo: '37', descripcion: 'Otro' },
    ];
  }

  @Get('tipo-dte')
  @ApiOperation({ summary: 'Tipos de DTE' })
  getTipoDte() {
    return [
      { codigo: '01', descripcion: 'Factura' },
      { codigo: '03', descripcion: 'Comprobante de Credito Fiscal' },
      { codigo: '04', descripcion: 'Nota de Remision' },
      { codigo: '05', descripcion: 'Nota de Credito' },
      { codigo: '06', descripcion: 'Nota de Debito' },
      { codigo: '07', descripcion: 'Comprobante de Retencion' },
      { codigo: '08', descripcion: 'Comprobante de Liquidacion' },
      { codigo: '09', descripcion: 'Documento Contable de Liquidacion' },
      { codigo: '11', descripcion: 'Factura de Exportacion' },
      { codigo: '14', descripcion: 'Factura de Sujeto Excluido' },
      { codigo: '15', descripcion: 'Comprobante de Donacion' },
    ];
  }

  @Get('condicion-operacion')
  @ApiOperation({ summary: 'Condiciones de operacion' })
  getCondicionOperacion() {
    return [
      { codigo: 1, descripcion: 'Contado' },
      { codigo: 2, descripcion: 'A credito' },
      { codigo: 3, descripcion: 'Otro' },
    ];
  }

  @Get('forma-pago')
  @ApiOperation({ summary: 'Formas de pago' })
  getFormaPago() {
    return [
      { codigo: '01', descripcion: 'Billetes y monedas' },
      { codigo: '02', descripcion: 'Tarjeta Debito' },
      { codigo: '03', descripcion: 'Tarjeta Credito' },
      { codigo: '04', descripcion: 'Cheque' },
      { codigo: '05', descripcion: 'Transferencia - Deposito Bancario' },
      { codigo: '06', descripcion: 'Vales' },
      { codigo: '07', descripcion: 'Pagos por servicios de Internet' },
      { codigo: '08', descripcion: 'Bitcoin' },
      { codigo: '09', descripcion: 'Pagare' },
      { codigo: '10', descripcion: 'Aplicacion Mobil' },
      { codigo: '11', descripcion: 'LBTR (Liquidacion Bruta en Tiempo Real)' },
      { codigo: '12', descripcion: 'Letra de cambio' },
      { codigo: '13', descripcion: 'ACH (Automated Clearing House)' },
      { codigo: '14', descripcion: 'Giro' },
      { codigo: '99', descripcion: 'Otros' },
    ];
  }

  @Get('departamento')
  @ApiOperation({ summary: 'Departamentos de El Salvador' })
  getDepartamentos() {
    return [
      { codigo: '01', descripcion: 'Ahuachapan' },
      { codigo: '02', descripcion: 'Santa Ana' },
      { codigo: '03', descripcion: 'Sonsonate' },
      { codigo: '04', descripcion: 'Chalatenango' },
      { codigo: '05', descripcion: 'La Libertad' },
      { codigo: '06', descripcion: 'San Salvador' },
      { codigo: '07', descripcion: 'Cuscatlan' },
      { codigo: '08', descripcion: 'La Paz' },
      { codigo: '09', descripcion: 'Cabanas' },
      { codigo: '10', descripcion: 'San Vicente' },
      { codigo: '11', descripcion: 'Usulutan' },
      { codigo: '12', descripcion: 'San Miguel' },
      { codigo: '13', descripcion: 'Morazan' },
      { codigo: '14', descripcion: 'La Union' },
    ];
  }

  @Get('unidad-medida')
  @ApiOperation({ summary: 'Unidades de medida' })
  getUnidadMedida() {
    return [
      { codigo: 1, descripcion: 'Metro' },
      { codigo: 2, descripcion: 'Yarda' },
      { codigo: 3, descripcion: 'Vara' },
      { codigo: 4, descripcion: 'Pie' },
      { codigo: 5, descripcion: 'Pulgada' },
      { codigo: 6, descripcion: 'Milimetro' },
      { codigo: 7, descripcion: 'Centimetro' },
      { codigo: 8, descripcion: 'Kilometro' },
      { codigo: 9, descripcion: 'Milla' },
      { codigo: 10, descripcion: 'Metro cuadrado' },
      { codigo: 11, descripcion: 'Hectarea' },
      { codigo: 12, descripcion: 'Manzana' },
      { codigo: 13, descripcion: 'Acre' },
      { codigo: 14, descripcion: 'Kilometro cuadrado' },
      { codigo: 15, descripcion: 'Yarda cuadrada' },
      { codigo: 16, descripcion: 'Pie cuadrado' },
      { codigo: 17, descripcion: 'Metro cubico' },
      { codigo: 18, descripcion: 'Litro' },
      { codigo: 19, descripcion: 'Mililitro' },
      { codigo: 20, descripcion: 'Galon' },
      { codigo: 21, descripcion: 'Barril' },
      { codigo: 22, descripcion: 'Kilogramo' },
      { codigo: 23, descripcion: 'Gramo' },
      { codigo: 24, descripcion: 'Libra' },
      { codigo: 25, descripcion: 'Onza' },
      { codigo: 26, descripcion: 'Tonelada' },
      { codigo: 27, descripcion: 'Quintal' },
      { codigo: 28, descripcion: 'Arroba' },
      { codigo: 36, descripcion: 'Unidad' },
      { codigo: 59, descripcion: 'Docena' },
      { codigo: 99, descripcion: 'Otra' },
    ];
  }
}

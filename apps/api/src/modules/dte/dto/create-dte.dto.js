"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNotaDebitoDto = exports.CreateNotaCreditoDto = exports.DocumentoRelacionadoDto = exports.CreateCCFDto = exports.CreateFacturaDto = exports.ItemDto = exports.ReceptorCCFDto = exports.ReceptorFacturaDto = exports.EmisorDto = exports.DireccionDto = void 0;
class DireccionDto {
    departamento;
    municipio;
    complemento;
}
exports.DireccionDto = DireccionDto;
class EmisorDto {
    nit;
    nrc;
    nombre;
    codActividad;
    descActividad;
    nombreComercial;
    tipoEstablecimiento;
    direccion;
    telefono;
    correo;
    codEstableMH;
    codEstable;
    codPuntoVentaMH;
    codPuntoVenta;
}
exports.EmisorDto = EmisorDto;
class ReceptorFacturaDto {
    tipoDocumento;
    numDocumento;
    nrc;
    nombre;
    codActividad;
    descActividad;
    direccion;
    telefono;
    correo;
}
exports.ReceptorFacturaDto = ReceptorFacturaDto;
class ReceptorCCFDto {
    nit;
    nrc;
    nombre;
    codActividad;
    descActividad;
    nombreComercial;
    direccion;
    telefono;
    correo;
}
exports.ReceptorCCFDto = ReceptorCCFDto;
class ItemDto {
    descripcion;
    cantidad;
    precioUnitario;
    esGravado;
    esExento;
    codigo;
}
exports.ItemDto = ItemDto;
class CreateFacturaDto {
    tipoDte = '01';
    ambiente;
    emisor;
    receptor;
    items;
    codEstablecimiento;
    correlativo;
    condicionOperacion;
}
exports.CreateFacturaDto = CreateFacturaDto;
class CreateCCFDto {
    tipoDte = '03';
    ambiente;
    emisor;
    receptor;
    items;
    codEstablecimiento;
    correlativo;
    condicionOperacion;
}
exports.CreateCCFDto = CreateCCFDto;
class DocumentoRelacionadoDto {
    tipoDocumento;
    tipoGeneracion;
    numeroDocumento;
    fechaEmision;
}
exports.DocumentoRelacionadoDto = DocumentoRelacionadoDto;
class CreateNotaCreditoDto {
    tipoDte = '05';
    ambiente;
    emisor;
    receptor;
    documentosRelacionados;
    items;
    codEstablecimiento;
    correlativo;
    condicionOperacion;
}
exports.CreateNotaCreditoDto = CreateNotaCreditoDto;
class CreateNotaDebitoDto {
    tipoDte = '06';
    ambiente;
    emisor;
    receptor;
    documentosRelacionados;
    items;
    codEstablecimiento;
    correlativo;
    condicionOperacion;
}
exports.CreateNotaDebitoDto = CreateNotaDebitoDto;

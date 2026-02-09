"use strict";
// Onboarding types for frontend
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTE_TYPE_INFO = exports.STEP_INFO = void 0;
// Step metadata for UI
exports.STEP_INFO = {
    WELCOME: {
        name: 'Bienvenida',
        description: 'Introducción al proceso de autorización',
        icon: 'HandWaving',
    },
    COMPANY_INFO: {
        name: 'Datos de Empresa',
        description: 'Información del contribuyente',
        icon: 'Building2',
    },
    HACIENDA_CREDENTIALS: {
        name: 'Credenciales MH',
        description: 'Acceso a Servicios en Línea',
        icon: 'Key',
    },
    DTE_TYPE_SELECTION: {
        name: 'Tipos de DTE',
        description: 'Documentos a emitir',
        icon: 'FileText',
    },
    TEST_ENVIRONMENT_REQUEST: {
        name: 'Ambiente Pruebas',
        description: 'Solicitar acceso',
        icon: 'FlaskConical',
    },
    TEST_CERTIFICATE: {
        name: 'Certificado Pruebas',
        description: 'Certificado digital',
        icon: 'ShieldCheck',
    },
    API_CREDENTIALS_TEST: {
        name: 'API Pruebas',
        description: 'Credenciales de API',
        icon: 'KeyRound',
    },
    EXECUTE_TESTS: {
        name: 'Ejecutar Pruebas',
        description: 'Pruebas técnicas',
        icon: 'PlayCircle',
    },
    REQUEST_AUTHORIZATION: {
        name: 'Solicitar Autorización',
        description: 'Enviar solicitud',
        icon: 'Send',
    },
    PROD_CERTIFICATE: {
        name: 'Certificado Producción',
        description: 'Certificado productivo',
        icon: 'ShieldCheck',
    },
    API_CREDENTIALS_PROD: {
        name: 'API Producción',
        description: 'Credenciales productivas',
        icon: 'KeyRound',
    },
    FINAL_VALIDATION: {
        name: 'Validación Final',
        description: 'Verificar configuración',
        icon: 'CheckCircle2',
    },
    COMPLETED: {
        name: 'Completado',
        description: '¡Listo para facturar!',
        icon: 'PartyPopper',
    },
};
exports.DTE_TYPE_INFO = {
    FACTURA: {
        name: 'Factura',
        description: 'Factura electrónica para consumidores finales',
    },
    CREDITO_FISCAL: {
        name: 'Crédito Fiscal',
        description: 'Comprobante de Crédito Fiscal para contribuyentes',
    },
    NOTA_REMISION: {
        name: 'Nota de Remisión',
        description: 'Para traslado de mercaderías',
    },
    NOTA_CREDITO: {
        name: 'Nota de Crédito',
        description: 'Para anular o reducir el valor de facturas',
    },
    NOTA_DEBITO: {
        name: 'Nota de Débito',
        description: 'Para aumentar el valor de facturas',
    },
    COMPROBANTE_RETENCION: {
        name: 'Comprobante de Retención',
        description: 'Para retenciones de IVA',
    },
    COMPROBANTE_LIQUIDACION: {
        name: 'Comprobante de Liquidación',
        description: 'Para liquidaciones de comisiones',
    },
    DOCUMENTO_CONTABLE_LIQUIDACION: {
        name: 'Documento Contable',
        description: 'Documento contable de liquidación',
    },
    FACTURA_EXPORTACION: {
        name: 'Factura de Exportación',
        description: 'Para ventas al extranjero',
    },
    FACTURA_SUJETO_EXCLUIDO: {
        name: 'Factura Sujeto Excluido',
        description: 'Para sujetos excluidos del IVA',
    },
    COMPROBANTE_DONACION: {
        name: 'Comprobante de Donación',
        description: 'Para donaciones',
    },
};

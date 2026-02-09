"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogosAdminService = void 0;
const common_1 = require("@nestjs/common");
let CatalogosAdminService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CatalogosAdminService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CatalogosAdminService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        // ============ CATALOGO CRUD ============
        async getAllCatalogos() {
            const catalogos = await this.prisma.catalogo.findMany({
                orderBy: { codigo: 'asc' },
                include: {
                    _count: {
                        select: { items: true },
                    },
                },
            });
            return catalogos.map((cat) => ({
                ...cat,
                totalItems: cat._count.items,
            }));
        }
        async getCatalogoByCodigo(codigo) {
            const catalogo = await this.prisma.catalogo.findUnique({
                where: { codigo },
                include: {
                    _count: {
                        select: { items: true },
                    },
                },
            });
            if (!catalogo) {
                throw new common_1.NotFoundException(`Catalogo ${codigo} no encontrado`);
            }
            return {
                ...catalogo,
                totalItems: catalogo._count.items,
            };
        }
        async createCatalogo(data) {
            const existing = await this.prisma.catalogo.findUnique({
                where: { codigo: data.codigo },
            });
            if (existing) {
                throw new common_1.ConflictException(`Ya existe un catalogo con codigo ${data.codigo}`);
            }
            return this.prisma.catalogo.create({
                data: {
                    codigo: data.codigo,
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                },
            });
        }
        async updateCatalogo(codigo, data) {
            const catalogo = await this.prisma.catalogo.findUnique({
                where: { codigo },
            });
            if (!catalogo) {
                throw new common_1.NotFoundException(`Catalogo ${codigo} no encontrado`);
            }
            return this.prisma.catalogo.update({
                where: { codigo },
                data,
            });
        }
        // ============ CATALOGO ITEMS ============
        async getCatalogoItems(codigo, params) {
            const { page = 1, limit = 50, search, parentCodigo } = params;
            const skip = (page - 1) * limit;
            const catalogo = await this.prisma.catalogo.findUnique({
                where: { codigo },
            });
            if (!catalogo) {
                throw new common_1.NotFoundException(`Catalogo ${codigo} no encontrado`);
            }
            const where = {
                catalogoId: catalogo.id,
            };
            if (search) {
                where.OR = [
                    { codigo: { contains: search } },
                    { valor: { contains: search } },
                ];
            }
            if (parentCodigo) {
                where.parentCodigo = parentCodigo;
            }
            const [items, total] = await Promise.all([
                this.prisma.catalogoItem.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: [{ orden: 'asc' }, { codigo: 'asc' }],
                }),
                this.prisma.catalogoItem.count({ where }),
            ]);
            return {
                data: items,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        // ============ SYNC CATALOGO ============
        async syncCatalogo(codigo, data) {
            const catalogo = await this.prisma.catalogo.findUnique({
                where: { codigo },
            });
            if (!catalogo) {
                throw new common_1.NotFoundException(`Catalogo ${codigo} no encontrado`);
            }
            // Use transaction to replace all items
            await this.prisma.$transaction(async (tx) => {
                // Delete all existing items
                await tx.catalogoItem.deleteMany({
                    where: { catalogoId: catalogo.id },
                });
                // Insert new items
                if (data.items.length > 0) {
                    await tx.catalogoItem.createMany({
                        data: data.items.map((item, index) => ({
                            catalogoId: catalogo.id,
                            codigo: item.codigo,
                            valor: item.valor,
                            descripcion: item.descripcion,
                            parentCodigo: item.parentCodigo,
                            orden: item.orden ?? index,
                            metadata: item.metadata,
                        })),
                    });
                }
                // Update catalogo metadata
                await tx.catalogo.update({
                    where: { id: catalogo.id },
                    data: {
                        totalItems: data.items.length,
                        lastSyncAt: new Date(),
                        version: data.version || catalogo.version,
                    },
                });
            });
            return this.getCatalogoByCodigo(codigo);
        }
        // ============ EXPORT CATALOGO ============
        async exportCatalogo(codigo) {
            const catalogo = await this.prisma.catalogo.findUnique({
                where: { codigo },
                include: {
                    items: {
                        orderBy: [{ orden: 'asc' }, { codigo: 'asc' }],
                    },
                },
            });
            if (!catalogo) {
                throw new common_1.NotFoundException(`Catalogo ${codigo} no encontrado`);
            }
            return {
                codigo: catalogo.codigo,
                nombre: catalogo.nombre,
                descripcion: catalogo.descripcion,
                version: catalogo.version,
                exportedAt: new Date().toISOString(),
                items: catalogo.items.map((item) => ({
                    codigo: item.codigo,
                    valor: item.valor,
                    descripcion: item.descripcion,
                    parentCodigo: item.parentCodigo,
                    orden: item.orden,
                    metadata: item.metadata ? JSON.parse(item.metadata) : null,
                })),
            };
        }
        // ============ PUBLIC ENDPOINTS (for forms) ============
        async getPublicCatalogoItems(codigo, parentCodigo) {
            const catalogo = await this.prisma.catalogo.findUnique({
                where: { codigo, isActive: true },
            });
            if (!catalogo) {
                throw new common_1.NotFoundException(`Catalogo ${codigo} no encontrado`);
            }
            const where = {
                catalogoId: catalogo.id,
                isActive: true,
            };
            if (parentCodigo) {
                where.parentCodigo = parentCodigo;
            }
            return this.prisma.catalogoItem.findMany({
                where,
                orderBy: [{ orden: 'asc' }, { valor: 'asc' }],
                select: {
                    codigo: true,
                    valor: true,
                    descripcion: true,
                    parentCodigo: true,
                },
            });
        }
        // ============ SEED INITIAL CATALOGOS ============
        async seedInitialCatalogos() {
            const catalogos = [
                { codigo: 'CAT-002', nombre: 'Tipos de Documento Tributario', descripcion: 'Tipos de documentos tributarios electronicos (DTE)' },
                { codigo: 'CAT-003', nombre: 'Tipos de Contingencia', descripcion: 'Motivos de contingencia para emision de DTE' },
                { codigo: 'CAT-005', nombre: 'Condiciones de Operacion', descripcion: 'Condiciones de la operacion comercial' },
                { codigo: 'CAT-007', nombre: 'Formas de Pago', descripcion: 'Metodos de pago aceptados' },
                { codigo: 'CAT-011', nombre: 'Tipos de Item', descripcion: 'Clasificacion de items en documentos' },
                { codigo: 'CAT-012', nombre: 'Departamentos', descripcion: 'Departamentos de El Salvador' },
                { codigo: 'CAT-013', nombre: 'Municipios', descripcion: 'Municipios de El Salvador' },
                { codigo: 'CAT-014', nombre: 'Unidades de Medida', descripcion: 'Unidades de medida para items' },
                { codigo: 'CAT-019', nombre: 'Actividades Economicas', descripcion: 'Clasificacion de actividades economicas' },
                { codigo: 'CAT-022', nombre: 'Tipos de Documento de Identificacion', descripcion: 'Documentos de identificacion personal' },
            ];
            const results = [];
            for (const cat of catalogos) {
                const existing = await this.prisma.catalogo.findUnique({
                    where: { codigo: cat.codigo },
                });
                if (!existing) {
                    const created = await this.prisma.catalogo.create({ data: cat });
                    results.push({ ...created, status: 'created' });
                }
                else {
                    results.push({ ...existing, status: 'exists' });
                }
            }
            return results;
        }
        // ============ SEED DEPARTAMENTOS Y MUNICIPIOS ============
        async seedDepartamentosYMunicipios() {
            const departamentos = [
                { codigo: '01', valor: 'Ahuachapan' },
                { codigo: '02', valor: 'Santa Ana' },
                { codigo: '03', valor: 'Sonsonate' },
                { codigo: '04', valor: 'Chalatenango' },
                { codigo: '05', valor: 'La Libertad' },
                { codigo: '06', valor: 'San Salvador' },
                { codigo: '07', valor: 'Cuscatlan' },
                { codigo: '08', valor: 'La Paz' },
                { codigo: '09', valor: 'Cabanas' },
                { codigo: '10', valor: 'San Vicente' },
                { codigo: '11', valor: 'Usulutan' },
                { codigo: '12', valor: 'San Miguel' },
                { codigo: '13', valor: 'Morazan' },
                { codigo: '14', valor: 'La Union' },
            ];
            // First, ensure CAT-012 exists
            let catDep = await this.prisma.catalogo.findUnique({ where: { codigo: 'CAT-012' } });
            if (!catDep) {
                catDep = await this.prisma.catalogo.create({
                    data: { codigo: 'CAT-012', nombre: 'Departamentos', descripcion: 'Departamentos de El Salvador' },
                });
            }
            // Sync departamentos
            await this.syncCatalogo('CAT-012', { items: departamentos });
            return { message: 'Departamentos sincronizados', count: departamentos.length };
        }
    };
    return CatalogosAdminService = _classThis;
})();
exports.CatalogosAdminService = CatalogosAdminService;

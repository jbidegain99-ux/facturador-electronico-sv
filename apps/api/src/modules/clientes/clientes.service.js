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
exports.ClientesService = void 0;
const common_1 = require("@nestjs/common");
const ALLOWED_SORT_FIELDS = {
    nombre: 'nombre',
    numDocumento: 'numDocumento',
    createdAt: 'createdAt',
    tipoDocumento: 'tipoDocumento',
    correo: 'correo',
};
let ClientesService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ClientesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClientesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new common_1.Logger(ClientesService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        async create(tenantId, createClienteDto) {
            this.logger.log(`Creating cliente for tenant ${tenantId}`);
            // Check if client with same document already exists for this tenant
            const existingCliente = await this.prisma.cliente.findUnique({
                where: {
                    tenantId_numDocumento: {
                        tenantId,
                        numDocumento: createClienteDto.numDocumento,
                    },
                },
            });
            if (existingCliente) {
                this.logger.warn(`Cliente with document ${createClienteDto.numDocumento} already exists for tenant ${tenantId}`);
                throw new common_1.ConflictException('Ya existe un cliente con este numero de documento');
            }
            const cliente = await this.prisma.cliente.create({
                data: {
                    tenantId,
                    tipoDocumento: createClienteDto.tipoDocumento,
                    numDocumento: createClienteDto.numDocumento,
                    nombre: createClienteDto.nombre,
                    nrc: createClienteDto.nrc,
                    correo: createClienteDto.correo,
                    telefono: createClienteDto.telefono,
                    direccion: JSON.stringify(createClienteDto.direccion || {}),
                },
            });
            this.logger.log(`Cliente ${cliente.id} created successfully`);
            return cliente;
        }
        async findAll(tenantId, query) {
            const page = Math.max(1, Number(query?.page) || 1);
            const limit = Math.min(Math.max(1, Number(query?.limit) || 20), 100);
            const search = query?.search;
            const sortBy = query?.sortBy && ALLOWED_SORT_FIELDS[query.sortBy] ? ALLOWED_SORT_FIELDS[query.sortBy] : 'createdAt';
            const sortOrder = query?.sortOrder ?? 'desc';
            this.logger.log(`Finding clientes for tenant ${tenantId}, page=${page}, limit=${limit}, search=${search || 'none'}, sort=${sortBy} ${sortOrder}`);
            const skip = (page - 1) * limit;
            const where = { tenantId };
            if (search) {
                where.OR = [
                    { nombre: { contains: search } },
                    { numDocumento: { contains: search } },
                    { correo: { contains: search } },
                ];
            }
            const [data, total] = await Promise.all([
                this.prisma.cliente.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                }),
                this.prisma.cliente.count({ where }),
            ]);
            this.logger.log(`Found ${total} clientes, returning ${data.length} results (page ${page})`);
            return {
                data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        async findOne(tenantId, id) {
            this.logger.log(`Finding cliente ${id} for tenant ${tenantId}`);
            const cliente = await this.prisma.cliente.findFirst({
                where: { id, tenantId },
            });
            if (!cliente) {
                this.logger.warn(`Cliente ${id} not found for tenant ${tenantId}`);
                throw new common_1.NotFoundException('Cliente no encontrado');
            }
            return cliente;
        }
        async update(tenantId, id, updateClienteDto) {
            this.logger.log(`Updating cliente ${id} for tenant ${tenantId}`);
            // Verify cliente belongs to tenant
            const existingCliente = await this.findOne(tenantId, id);
            // If changing document number, check it doesn't conflict
            if (updateClienteDto.numDocumento && updateClienteDto.numDocumento !== existingCliente.numDocumento) {
                const conflictingCliente = await this.prisma.cliente.findUnique({
                    where: {
                        tenantId_numDocumento: {
                            tenantId,
                            numDocumento: updateClienteDto.numDocumento,
                        },
                    },
                });
                if (conflictingCliente && conflictingCliente.id !== id) {
                    throw new common_1.ConflictException('Ya existe un cliente con este numero de documento');
                }
            }
            const updateData = { ...updateClienteDto };
            if (updateClienteDto.direccion) {
                updateData.direccion = JSON.stringify(updateClienteDto.direccion);
            }
            const cliente = await this.prisma.cliente.update({
                where: { id },
                data: updateData,
            });
            this.logger.log(`Cliente ${id} updated successfully`);
            return cliente;
        }
        async remove(tenantId, id) {
            this.logger.log(`Removing cliente ${id} for tenant ${tenantId}`);
            // Verify cliente belongs to tenant
            await this.findOne(tenantId, id);
            // Check if cliente has associated DTEs
            const dtesCount = await this.prisma.dTE.count({
                where: { clienteId: id },
            });
            if (dtesCount > 0) {
                this.logger.warn(`Cannot delete cliente ${id} - has ${dtesCount} associated DTEs`);
                throw new common_1.ConflictException(`No se puede eliminar el cliente porque tiene ${dtesCount} documento(s) asociado(s)`);
            }
            await this.prisma.cliente.delete({
                where: { id },
            });
            this.logger.log(`Cliente ${id} deleted successfully`);
            return { message: 'Cliente eliminado exitosamente' };
        }
    };
    return ClientesService = _classThis;
})();
exports.ClientesService = ClientesService;

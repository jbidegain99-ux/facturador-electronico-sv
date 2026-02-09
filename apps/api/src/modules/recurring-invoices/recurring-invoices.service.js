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
exports.RecurringInvoicesService = void 0;
const common_1 = require("@nestjs/common");
let RecurringInvoicesService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RecurringInvoicesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RecurringInvoicesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new common_1.Logger(RecurringInvoicesService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        async create(tenantId, dto) {
            // Verify client belongs to tenant
            const cliente = await this.prisma.cliente.findFirst({
                where: { id: dto.clienteId, tenantId },
            });
            if (!cliente) {
                throw new common_1.NotFoundException('Cliente no encontrado');
            }
            const startDate = new Date(dto.startDate);
            const nextRunDate = this.calculateNextRunDate({
                interval: dto.interval,
                anchorDay: dto.anchorDay,
                dayOfWeek: dto.dayOfWeek,
                startDate,
            });
            return this.prisma.recurringInvoiceTemplate.create({
                data: {
                    tenantId,
                    nombre: dto.nombre,
                    descripcion: dto.descripcion,
                    clienteId: dto.clienteId,
                    tipoDte: dto.tipoDte || '01',
                    interval: dto.interval,
                    anchorDay: dto.anchorDay,
                    dayOfWeek: dto.dayOfWeek,
                    mode: dto.mode || 'AUTO_DRAFT',
                    autoTransmit: dto.autoTransmit || false,
                    items: JSON.stringify(dto.items),
                    notas: dto.notas,
                    startDate,
                    endDate: dto.endDate ? new Date(dto.endDate) : null,
                    nextRunDate,
                },
            });
        }
        async findAll(tenantId, query) {
            const page = Math.max(1, Number(query.page) || 1);
            const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
            const skip = (page - 1) * limit;
            const where = { tenantId };
            if (query.status) {
                where.status = query.status;
            }
            if (query.search) {
                where.OR = [
                    { nombre: { contains: query.search } },
                    { cliente: { nombre: { contains: query.search } } },
                ];
            }
            const allowedSortFields = ['nombre', 'createdAt', 'nextRunDate', 'status'];
            const sortBy = allowedSortFields.includes(query.sortBy || '') ? query.sortBy : 'createdAt';
            const sortOrder = query.sortOrder || 'desc';
            const [data, total] = await Promise.all([
                this.prisma.recurringInvoiceTemplate.findMany({
                    where,
                    include: {
                        cliente: { select: { id: true, nombre: true, numDocumento: true } },
                        _count: { select: { history: true } },
                    },
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                this.prisma.recurringInvoiceTemplate.count({ where }),
            ]);
            return {
                data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        async findOne(tenantId, id) {
            const template = await this.prisma.recurringInvoiceTemplate.findFirst({
                where: { id, tenantId },
                include: {
                    cliente: { select: { id: true, nombre: true, numDocumento: true } },
                    history: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    },
                    _count: { select: { history: true } },
                },
            });
            if (!template) {
                throw new common_1.NotFoundException('Template no encontrado');
            }
            return template;
        }
        async update(tenantId, id, dto) {
            const template = await this.prisma.recurringInvoiceTemplate.findFirst({
                where: { id, tenantId },
            });
            if (!template) {
                throw new common_1.NotFoundException('Template no encontrado');
            }
            const data = {};
            if (dto.nombre !== undefined)
                data.nombre = dto.nombre;
            if (dto.descripcion !== undefined)
                data.descripcion = dto.descripcion;
            if (dto.tipoDte !== undefined)
                data.tipoDte = dto.tipoDte;
            if (dto.mode !== undefined)
                data.mode = dto.mode;
            if (dto.autoTransmit !== undefined)
                data.autoTransmit = dto.autoTransmit;
            if (dto.notas !== undefined)
                data.notas = dto.notas;
            if (dto.items !== undefined)
                data.items = JSON.stringify(dto.items);
            if (dto.endDate !== undefined)
                data.endDate = dto.endDate ? new Date(dto.endDate) : null;
            // If schedule changed, recalculate nextRunDate
            if (dto.interval !== undefined || dto.anchorDay !== undefined || dto.dayOfWeek !== undefined) {
                data.interval = dto.interval ?? template.interval;
                data.anchorDay = dto.anchorDay ?? template.anchorDay;
                data.dayOfWeek = dto.dayOfWeek ?? template.dayOfWeek;
                data.nextRunDate = this.calculateNextRunDate({
                    interval: data.interval,
                    anchorDay: data.anchorDay,
                    dayOfWeek: data.dayOfWeek,
                    startDate: template.startDate,
                });
            }
            if (dto.clienteId !== undefined) {
                const cliente = await this.prisma.cliente.findFirst({
                    where: { id: dto.clienteId, tenantId },
                });
                if (!cliente) {
                    throw new common_1.NotFoundException('Cliente no encontrado');
                }
                data.clienteId = dto.clienteId;
            }
            return this.prisma.recurringInvoiceTemplate.update({
                where: { id },
                data,
            });
        }
        async pause(tenantId, id) {
            const template = await this.prisma.recurringInvoiceTemplate.findFirst({
                where: { id, tenantId },
            });
            if (!template) {
                throw new common_1.NotFoundException('Template no encontrado');
            }
            if (template.status !== 'ACTIVE' && template.status !== 'SUSPENDED_ERROR') {
                throw new common_1.BadRequestException('Solo se pueden pausar templates activos o suspendidos');
            }
            return this.prisma.recurringInvoiceTemplate.update({
                where: { id },
                data: { status: 'PAUSED' },
            });
        }
        async resume(tenantId, id) {
            const template = await this.prisma.recurringInvoiceTemplate.findFirst({
                where: { id, tenantId },
            });
            if (!template) {
                throw new common_1.NotFoundException('Template no encontrado');
            }
            if (template.status !== 'PAUSED' && template.status !== 'SUSPENDED_ERROR') {
                throw new common_1.BadRequestException('Solo se pueden reanudar templates pausados o suspendidos');
            }
            const nextRunDate = this.calculateNextRunDate({
                interval: template.interval,
                anchorDay: template.anchorDay ?? undefined,
                dayOfWeek: template.dayOfWeek ?? undefined,
                startDate: template.startDate,
            });
            return this.prisma.recurringInvoiceTemplate.update({
                where: { id },
                data: {
                    status: 'ACTIVE',
                    consecutiveFailures: 0,
                    lastError: null,
                    nextRunDate,
                },
            });
        }
        async cancel(tenantId, id) {
            const template = await this.prisma.recurringInvoiceTemplate.findFirst({
                where: { id, tenantId },
            });
            if (!template) {
                throw new common_1.NotFoundException('Template no encontrado');
            }
            if (template.status === 'CANCELLED') {
                throw new common_1.BadRequestException('Template ya esta cancelado');
            }
            return this.prisma.recurringInvoiceTemplate.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
        }
        async getHistory(tenantId, templateId, query) {
            // Verify template belongs to tenant
            const template = await this.prisma.recurringInvoiceTemplate.findFirst({
                where: { id: templateId, tenantId },
            });
            if (!template) {
                throw new common_1.NotFoundException('Template no encontrado');
            }
            const page = Math.max(1, Number(query.page) || 1);
            const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
            const skip = (page - 1) * limit;
            const where = { templateId };
            const [data, total] = await Promise.all([
                this.prisma.recurringInvoiceHistory.findMany({
                    where,
                    orderBy: { runDate: 'desc' },
                    skip,
                    take: limit,
                }),
                this.prisma.recurringInvoiceHistory.count({ where }),
            ]);
            return {
                data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        /**
         * Get templates that are due to run (used by scheduler)
         */
        async getDueTemplates() {
            return this.prisma.recurringInvoiceTemplate.findMany({
                where: {
                    status: 'ACTIVE',
                    nextRunDate: { lte: new Date() },
                    OR: [
                        { endDate: null },
                        { endDate: { gte: new Date() } },
                    ],
                },
            });
        }
        /**
         * Record a successful execution
         */
        async recordSuccess(templateId, dteId) {
            const template = await this.prisma.recurringInvoiceTemplate.findUnique({
                where: { id: templateId },
            });
            if (!template)
                return;
            const nextRunDate = this.calculateNextRunDate({
                interval: template.interval,
                anchorDay: template.anchorDay ?? undefined,
                dayOfWeek: template.dayOfWeek ?? undefined,
                startDate: template.startDate,
            });
            await this.prisma.$transaction([
                this.prisma.recurringInvoiceHistory.create({
                    data: {
                        templateId,
                        dteId,
                        status: 'SUCCESS',
                        runDate: new Date(),
                    },
                }),
                this.prisma.recurringInvoiceTemplate.update({
                    where: { id: templateId },
                    data: {
                        lastRunDate: new Date(),
                        nextRunDate,
                        consecutiveFailures: 0,
                        lastError: null,
                    },
                }),
            ]);
        }
        /**
         * Record a failed execution
         */
        async recordFailure(templateId, error) {
            const template = await this.prisma.recurringInvoiceTemplate.findUnique({
                where: { id: templateId },
            });
            if (!template)
                return;
            const newFailures = template.consecutiveFailures + 1;
            const shouldSuspend = newFailures >= 3;
            const nextRunDate = this.calculateNextRunDate({
                interval: template.interval,
                anchorDay: template.anchorDay ?? undefined,
                dayOfWeek: template.dayOfWeek ?? undefined,
                startDate: template.startDate,
            });
            await this.prisma.$transaction([
                this.prisma.recurringInvoiceHistory.create({
                    data: {
                        templateId,
                        status: 'FAILED',
                        error,
                        runDate: new Date(),
                    },
                }),
                this.prisma.recurringInvoiceTemplate.update({
                    where: { id: templateId },
                    data: {
                        lastRunDate: new Date(),
                        nextRunDate: shouldSuspend ? template.nextRunDate : nextRunDate,
                        consecutiveFailures: newFailures,
                        lastError: error,
                        status: shouldSuspend ? 'SUSPENDED_ERROR' : 'ACTIVE',
                    },
                }),
            ]);
            if (shouldSuspend) {
                this.logger.warn(`Template ${templateId} suspended after ${newFailures} consecutive failures`);
            }
        }
        /**
         * Calculate the next run date based on interval settings.
         * Always returns a future date.
         */
        calculateNextRunDate(config) {
            const now = new Date();
            let next = new Date(Math.max(now.getTime(), config.startDate.getTime()));
            switch (config.interval) {
                case 'DAILY': {
                    // Next day at 01:00 UTC
                    next.setUTCDate(next.getUTCDate() + 1);
                    next.setUTCHours(1, 0, 0, 0);
                    break;
                }
                case 'WEEKLY': {
                    const targetDay = config.dayOfWeek ?? 1; // Default Monday
                    const currentDay = next.getUTCDay();
                    let daysUntil = targetDay - currentDay;
                    if (daysUntil <= 0)
                        daysUntil += 7;
                    next.setUTCDate(next.getUTCDate() + daysUntil);
                    next.setUTCHours(1, 0, 0, 0);
                    break;
                }
                case 'MONTHLY': {
                    const targetDay = config.anchorDay ?? 1;
                    next.setUTCMonth(next.getUTCMonth() + 1);
                    // Handle months with fewer days
                    const lastDay = new Date(next.getUTCFullYear(), next.getUTCMonth() + 1, 0).getDate();
                    next.setUTCDate(Math.min(targetDay, lastDay));
                    next.setUTCHours(1, 0, 0, 0);
                    break;
                }
                case 'YEARLY': {
                    next.setUTCFullYear(next.getUTCFullYear() + 1);
                    if (config.anchorDay) {
                        const lastDay = new Date(next.getUTCFullYear(), next.getUTCMonth() + 1, 0).getDate();
                        next.setUTCDate(Math.min(config.anchorDay, lastDay));
                    }
                    next.setUTCHours(1, 0, 0, 0);
                    break;
                }
                default:
                    next.setUTCDate(next.getUTCDate() + 1);
                    next.setUTCHours(1, 0, 0, 0);
            }
            return next;
        }
    };
    return RecurringInvoicesService = _classThis;
})();
exports.RecurringInvoicesService = RecurringInvoicesService;

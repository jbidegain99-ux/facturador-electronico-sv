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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const create_ticket_dto_1 = require("./dto/create-ticket.dto");
const update_ticket_dto_1 = require("./dto/update-ticket.dto");
let SupportService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SupportService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SupportService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        // ============ TICKET NUMBER GENERATION ============
        async generateTicketNumber() {
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            // Count tickets created today to generate sequence
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            const todayTickets = await this.prisma.supportTicket.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });
            const sequence = String(todayTickets + 1).padStart(4, '0');
            return `TKT-${dateStr}-${sequence}`;
        }
        // ============ USER ENDPOINTS ============
        async createTicket(tenantId, requesterId, data) {
            const ticketNumber = await this.generateTicketNumber();
            const ticket = await this.prisma.supportTicket.create({
                data: {
                    ticketNumber,
                    tenantId,
                    requesterId,
                    type: data.type,
                    subject: data.subject,
                    description: data.description,
                    metadata: data.metadata,
                    priority: data.priority || create_ticket_dto_1.TicketPriority.MEDIUM,
                    status: update_ticket_dto_1.TicketStatus.PENDING,
                },
                include: {
                    tenant: { select: { nombre: true } },
                    requester: { select: { nombre: true, email: true } },
                },
            });
            // Create activity record
            await this.prisma.ticketActivity.create({
                data: {
                    ticketId: ticket.id,
                    actorId: requesterId,
                    action: 'CREATED',
                    newValue: `Ticket creado: ${data.subject}`,
                },
            });
            return ticket;
        }
        async getUserTickets(tenantId, page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            const [tickets, total] = await Promise.all([
                this.prisma.supportTicket.findMany({
                    where: { tenantId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        requester: { select: { nombre: true, email: true } },
                        assignedTo: { select: { nombre: true } },
                        _count: { select: { comments: true } },
                    },
                }),
                this.prisma.supportTicket.count({ where: { tenantId } }),
            ]);
            return {
                data: tickets,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        async getUserTicketById(tenantId, ticketId, userId) {
            const ticket = await this.prisma.supportTicket.findUnique({
                where: { id: ticketId },
                include: {
                    tenant: { select: { nombre: true } },
                    requester: { select: { id: true, nombre: true, email: true } },
                    assignedTo: { select: { nombre: true, email: true } },
                    comments: {
                        where: { isInternal: false }, // Users don't see internal comments
                        orderBy: { createdAt: 'asc' },
                        include: {
                            author: { select: { nombre: true, email: true } },
                        },
                    },
                    activities: {
                        orderBy: { createdAt: 'desc' },
                        take: 20,
                        include: {
                            actor: { select: { nombre: true } },
                        },
                    },
                },
            });
            if (!ticket) {
                throw new common_1.NotFoundException('Ticket no encontrado');
            }
            if (ticket.tenantId !== tenantId) {
                throw new common_1.ForbiddenException('No tienes acceso a este ticket');
            }
            return ticket;
        }
        async addUserComment(tenantId, ticketId, userId, data) {
            const ticket = await this.prisma.supportTicket.findUnique({
                where: { id: ticketId },
            });
            if (!ticket) {
                throw new common_1.NotFoundException('Ticket no encontrado');
            }
            if (ticket.tenantId !== tenantId) {
                throw new common_1.ForbiddenException('No tienes acceso a este ticket');
            }
            const comment = await this.prisma.ticketComment.create({
                data: {
                    ticketId,
                    authorId: userId,
                    content: data.content,
                    isInternal: false, // Users can't create internal comments
                },
                include: {
                    author: { select: { nombre: true, email: true } },
                },
            });
            // Create activity
            await this.prisma.ticketActivity.create({
                data: {
                    ticketId,
                    actorId: userId,
                    action: 'COMMENT_ADDED',
                    newValue: 'Comentario agregado por usuario',
                },
            });
            return comment;
        }
        // ============ ADMIN ENDPOINTS ============
        async getAllTickets(params) {
            const { page = 1, limit = 20, status, priority, assignedToId, tenantId, type, search } = params;
            const skip = (page - 1) * limit;
            const where = {};
            if (status)
                where.status = status;
            if (priority)
                where.priority = priority;
            if (assignedToId)
                where.assignedToId = assignedToId;
            if (tenantId)
                where.tenantId = tenantId;
            if (type)
                where.type = type;
            if (search) {
                where.OR = [
                    { ticketNumber: { contains: search } },
                    { subject: { contains: search } },
                    { tenant: { nombre: { contains: search } } },
                ];
            }
            const [tickets, total] = await Promise.all([
                this.prisma.supportTicket.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        tenant: { select: { id: true, nombre: true, nit: true } },
                        requester: { select: { nombre: true, email: true } },
                        assignedTo: { select: { id: true, nombre: true } },
                        _count: { select: { comments: true } },
                    },
                }),
                this.prisma.supportTicket.count({ where }),
            ]);
            return {
                data: tickets,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        async getTicketStats() {
            const [pending, assigned, inProgress, waitingCustomer, resolved, closed, byPriority, byType,] = await Promise.all([
                this.prisma.supportTicket.count({ where: { status: 'PENDING' } }),
                this.prisma.supportTicket.count({ where: { status: 'ASSIGNED' } }),
                this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
                this.prisma.supportTicket.count({ where: { status: 'WAITING_CUSTOMER' } }),
                this.prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
                this.prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
                this.prisma.supportTicket.groupBy({
                    by: ['priority'],
                    _count: { priority: true },
                }),
                this.prisma.supportTicket.groupBy({
                    by: ['type'],
                    _count: { type: true },
                }),
            ]);
            // Calculate average resolution time (for resolved tickets in the last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const resolvedTickets = await this.prisma.supportTicket.findMany({
                where: {
                    status: { in: ['RESOLVED', 'CLOSED'] },
                    resolvedAt: { gte: thirtyDaysAgo },
                },
                select: {
                    createdAt: true,
                    resolvedAt: true,
                },
            });
            let avgResolutionHours = 0;
            if (resolvedTickets.length > 0) {
                const totalHours = resolvedTickets.reduce((acc, t) => {
                    if (t.resolvedAt) {
                        const hours = (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
                        return acc + hours;
                    }
                    return acc;
                }, 0);
                avgResolutionHours = Math.round(totalHours / resolvedTickets.length);
            }
            return {
                pending,
                assigned,
                inProgress,
                waitingCustomer,
                resolved,
                closed,
                total: pending + assigned + inProgress + waitingCustomer + resolved + closed,
                open: pending + assigned + inProgress + waitingCustomer,
                byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.priority })),
                byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
                avgResolutionHours,
            };
        }
        async getAdminTicketById(ticketId) {
            const ticket = await this.prisma.supportTicket.findUnique({
                where: { id: ticketId },
                include: {
                    tenant: { select: { id: true, nombre: true, nit: true, correo: true } },
                    requester: { select: { id: true, nombre: true, email: true } },
                    assignedTo: { select: { id: true, nombre: true, email: true } },
                    comments: {
                        orderBy: { createdAt: 'asc' },
                        include: {
                            author: { select: { id: true, nombre: true, email: true, rol: true } },
                        },
                    },
                    activities: {
                        orderBy: { createdAt: 'desc' },
                        include: {
                            actor: { select: { nombre: true, email: true } },
                        },
                    },
                },
            });
            if (!ticket) {
                throw new common_1.NotFoundException('Ticket no encontrado');
            }
            return ticket;
        }
        async updateTicket(ticketId, adminId, data) {
            const ticket = await this.prisma.supportTicket.findUnique({
                where: { id: ticketId },
            });
            if (!ticket) {
                throw new common_1.NotFoundException('Ticket no encontrado');
            }
            const updates = {};
            const activities = [];
            // Track status change
            if (data.status && data.status !== ticket.status) {
                updates.status = data.status;
                activities.push({
                    ticketId,
                    actorId: adminId,
                    action: 'STATUS_CHANGED',
                    oldValue: ticket.status,
                    newValue: data.status,
                });
                // Set resolvedAt if resolving
                if (data.status === update_ticket_dto_1.TicketStatus.RESOLVED || data.status === update_ticket_dto_1.TicketStatus.CLOSED) {
                    updates.resolvedAt = new Date();
                }
            }
            // Track priority change
            if (data.priority && data.priority !== ticket.priority) {
                updates.priority = data.priority;
                activities.push({
                    ticketId,
                    actorId: adminId,
                    action: 'PRIORITY_CHANGED',
                    oldValue: ticket.priority,
                    newValue: data.priority,
                });
            }
            // Track assignment change
            if (data.assignedToId !== undefined && data.assignedToId !== ticket.assignedToId) {
                updates.assignedToId = data.assignedToId || null;
                updates.assignedAt = data.assignedToId ? new Date() : null;
                if (data.assignedToId) {
                    // Get the assignee name
                    const assignee = await this.prisma.user.findUnique({
                        where: { id: data.assignedToId },
                        select: { nombre: true },
                    });
                    activities.push({
                        ticketId,
                        actorId: adminId,
                        action: 'ASSIGNED',
                        oldValue: ticket.assignedToId,
                        newValue: assignee?.nombre || data.assignedToId,
                    });
                }
            }
            // Track resolution
            if (data.resolution && data.resolution !== ticket.resolution) {
                updates.resolution = data.resolution;
                activities.push({
                    ticketId,
                    actorId: adminId,
                    action: 'RESOLVED',
                    newValue: 'Resolucion agregada',
                });
            }
            // Update ticket and create activities in transaction
            const [updatedTicket] = await this.prisma.$transaction([
                this.prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: updates,
                    include: {
                        tenant: { select: { nombre: true } },
                        requester: { select: { nombre: true, email: true } },
                        assignedTo: { select: { nombre: true, email: true } },
                    },
                }),
                ...activities.map((activity) => this.prisma.ticketActivity.create({ data: activity })),
            ]);
            return updatedTicket;
        }
        async addAdminComment(ticketId, adminId, data) {
            const ticket = await this.prisma.supportTicket.findUnique({
                where: { id: ticketId },
            });
            if (!ticket) {
                throw new common_1.NotFoundException('Ticket no encontrado');
            }
            const comment = await this.prisma.ticketComment.create({
                data: {
                    ticketId,
                    authorId: adminId,
                    content: data.content,
                    isInternal: data.isInternal || false,
                },
                include: {
                    author: { select: { nombre: true, email: true, rol: true } },
                },
            });
            // Create activity
            await this.prisma.ticketActivity.create({
                data: {
                    ticketId,
                    actorId: adminId,
                    action: 'COMMENT_ADDED',
                    newValue: data.isInternal ? 'Nota interna agregada' : 'Respuesta agregada',
                },
            });
            return comment;
        }
        async getSuperAdmins() {
            return this.prisma.user.findMany({
                where: { rol: 'SUPER_ADMIN' },
                select: { id: true, nombre: true, email: true },
            });
        }
        async getTicketsByTenant(tenantId, limit = 10) {
            return this.prisma.supportTicket.findMany({
                where: { tenantId },
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    requester: { select: { nombre: true } },
                    assignedTo: { select: { nombre: true } },
                },
            });
        }
    };
    return SupportService = _classThis;
})();
exports.SupportService = SupportService;

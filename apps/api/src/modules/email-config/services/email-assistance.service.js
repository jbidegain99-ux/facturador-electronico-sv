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
exports.EmailAssistanceService = void 0;
const common_1 = require("@nestjs/common");
const email_types_1 = require("../types/email.types");
let EmailAssistanceService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EmailAssistanceService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EmailAssistanceService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new common_1.Logger(EmailAssistanceService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        /**
         * Create an assistance request from a tenant
         */
        async createRequest(tenantId, dto) {
            const request = await this.prisma.emailConfigRequest.create({
                data: {
                    tenantId,
                    requestType: dto.requestType,
                    desiredProvider: dto.desiredProvider,
                    currentProvider: dto.currentProvider,
                    accountEmail: dto.accountEmail,
                    additionalNotes: dto.additionalNotes,
                    status: email_types_1.RequestStatus.PENDING,
                },
                include: {
                    tenant: true,
                    messages: true,
                },
            });
            // Add initial system message
            await this.prisma.emailConfigMessage.create({
                data: {
                    requestId: request.id,
                    senderType: email_types_1.MessageSender.SYSTEM,
                    message: 'Su solicitud ha sido recibida. Un miembro del equipo de Republicode se pondrá en contacto pronto.',
                },
            });
            this.logger.log(`Assistance request created for tenant ${tenantId}: ${dto.requestType}`);
            return request;
        }
        /**
         * Get all requests for a tenant
         */
        async getTenantRequests(tenantId) {
            return this.prisma.emailConfigRequest.findMany({
                where: { tenantId },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        /**
         * Get a specific request
         */
        async getRequest(requestId, tenantId) {
            const request = await this.prisma.emailConfigRequest.findUnique({
                where: { id: requestId },
                include: {
                    tenant: true,
                    messages: {
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            if (!request) {
                throw new common_1.NotFoundException('Assistance request not found');
            }
            // If tenantId provided, verify ownership
            if (tenantId && request.tenantId !== tenantId) {
                throw new common_1.ForbiddenException('Access denied to this request');
            }
            return request;
        }
        /**
         * Get all pending requests (for admin)
         */
        async getAllRequests(status) {
            const where = status ? { status } : {};
            return this.prisma.emailConfigRequest.findMany({
                where,
                include: {
                    tenant: true,
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        /**
         * Update request status (admin only)
         */
        async updateRequest(requestId, dto) {
            const request = await this.prisma.emailConfigRequest.findUnique({
                where: { id: requestId },
            });
            if (!request) {
                throw new common_1.NotFoundException('Assistance request not found');
            }
            const updateData = {};
            if (dto.status) {
                updateData.status = dto.status;
                if (dto.status === email_types_1.RequestStatus.COMPLETED) {
                    updateData.completedAt = new Date();
                }
            }
            if (dto.assignedTo !== undefined) {
                updateData.assignedTo = dto.assignedTo;
            }
            return this.prisma.emailConfigRequest.update({
                where: { id: requestId },
                data: updateData,
                include: {
                    tenant: true,
                    messages: true,
                },
            });
        }
        /**
         * Add a message to a request
         */
        async addMessage(requestId, senderType, senderId, dto) {
            const request = await this.prisma.emailConfigRequest.findUnique({
                where: { id: requestId },
            });
            if (!request) {
                throw new common_1.NotFoundException('Assistance request not found');
            }
            const message = await this.prisma.emailConfigMessage.create({
                data: {
                    requestId,
                    senderType,
                    senderId,
                    message: dto.message,
                    attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
                },
            });
            // If tenant is responding and status is WAITING_CLIENT, update to IN_PROGRESS
            if (senderType === email_types_1.MessageSender.TENANT &&
                request.status === email_types_1.RequestStatus.WAITING_CLIENT) {
                await this.prisma.emailConfigRequest.update({
                    where: { id: requestId },
                    data: { status: email_types_1.RequestStatus.IN_PROGRESS },
                });
            }
            // If Republicode is responding and status is PENDING, update to IN_PROGRESS
            if (senderType === email_types_1.MessageSender.REPUBLICODE &&
                request.status === email_types_1.RequestStatus.PENDING) {
                await this.prisma.emailConfigRequest.update({
                    where: { id: requestId },
                    data: { status: email_types_1.RequestStatus.IN_PROGRESS },
                });
            }
            return message;
        }
        /**
         * Get request statistics (for admin dashboard)
         */
        async getRequestStats() {
            const [pending, inProgress, waitingClient, completed, cancelled] = await Promise.all([
                this.prisma.emailConfigRequest.count({
                    where: { status: email_types_1.RequestStatus.PENDING },
                }),
                this.prisma.emailConfigRequest.count({
                    where: { status: email_types_1.RequestStatus.IN_PROGRESS },
                }),
                this.prisma.emailConfigRequest.count({
                    where: { status: email_types_1.RequestStatus.WAITING_CLIENT },
                }),
                this.prisma.emailConfigRequest.count({
                    where: { status: email_types_1.RequestStatus.COMPLETED },
                }),
                this.prisma.emailConfigRequest.count({
                    where: { status: email_types_1.RequestStatus.CANCELLED },
                }),
            ]);
            return {
                pending,
                inProgress,
                waitingClient,
                completed,
                cancelled,
                total: pending + inProgress + waitingClient + completed + cancelled,
            };
        }
    };
    return EmailAssistanceService = _classThis;
})();
exports.EmailAssistanceService = EmailAssistanceService;

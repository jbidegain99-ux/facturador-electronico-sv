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
exports.OnboardingCommunicationService = void 0;
const common_1 = require("@nestjs/common");
let OnboardingCommunicationService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OnboardingCommunicationService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OnboardingCommunicationService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        // =========================================================================
        // GET COMMUNICATIONS
        // =========================================================================
        async getCommunications(tenantId, page = 1, limit = 20) {
            const onboarding = await this.prisma.tenantOnboarding.findUnique({
                where: { tenantId },
            });
            if (!onboarding) {
                throw new common_1.NotFoundException('Onboarding no encontrado');
            }
            const skip = (page - 1) * limit;
            const [communications, total, unreadCount] = await Promise.all([
                this.prisma.onboardingCommunication.findMany({
                    where: { onboardingId: onboarding.id },
                    orderBy: { sentAt: 'desc' },
                    skip,
                    take: limit,
                }),
                this.prisma.onboardingCommunication.count({
                    where: { onboardingId: onboarding.id },
                }),
                this.prisma.onboardingCommunication.count({
                    where: {
                        onboardingId: onboarding.id,
                        direction: 'INCOMING',
                        readAt: null,
                    },
                }),
            ]);
            return {
                communications: communications.map((c) => ({
                    id: c.id,
                    type: c.type,
                    direction: c.direction,
                    subject: c.subject,
                    content: c.content,
                    attachments: c.attachments ? JSON.parse(c.attachments) : [],
                    relatedStep: c.relatedStep,
                    sentBy: c.sentBy,
                    sentAt: c.sentAt,
                    readAt: c.readAt,
                })),
                total,
                unreadCount,
                page,
                totalPages: Math.ceil(total / limit),
            };
        }
        // =========================================================================
        // ADD COMMUNICATION (CLIENT)
        // =========================================================================
        async addClientCommunication(tenantId, dto, userId) {
            const onboarding = await this.prisma.tenantOnboarding.findUnique({
                where: { tenantId },
            });
            if (!onboarding) {
                throw new common_1.NotFoundException('Onboarding no encontrado');
            }
            const communication = await this.prisma.onboardingCommunication.create({
                data: {
                    onboardingId: onboarding.id,
                    type: dto.type,
                    direction: 'OUTGOING',
                    subject: dto.subject,
                    content: dto.content,
                    attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
                    relatedStep: dto.relatedStep,
                    sentBy: userId,
                },
            });
            return {
                id: communication.id,
                message: 'Mensaje enviado correctamente',
            };
        }
        // =========================================================================
        // ADD COMMUNICATION (ADMIN)
        // =========================================================================
        async addAdminCommunication(onboardingId, dto, userId) {
            const onboarding = await this.prisma.tenantOnboarding.findUnique({
                where: { id: onboardingId },
            });
            if (!onboarding) {
                throw new common_1.NotFoundException('Onboarding no encontrado');
            }
            const communication = await this.prisma.onboardingCommunication.create({
                data: {
                    onboardingId,
                    type: dto.type,
                    direction: 'INCOMING',
                    subject: dto.subject,
                    content: dto.content,
                    attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
                    relatedStep: dto.relatedStep,
                    sentBy: userId,
                },
            });
            return {
                id: communication.id,
                message: 'Mensaje enviado al tenant correctamente',
            };
        }
        // =========================================================================
        // MARK AS READ
        // =========================================================================
        async markAsRead(tenantId, communicationId) {
            const onboarding = await this.prisma.tenantOnboarding.findUnique({
                where: { tenantId },
            });
            if (!onboarding) {
                throw new common_1.NotFoundException('Onboarding no encontrado');
            }
            const communication = await this.prisma.onboardingCommunication.findFirst({
                where: {
                    id: communicationId,
                    onboardingId: onboarding.id,
                },
            });
            if (!communication) {
                throw new common_1.NotFoundException('Comunicación no encontrada');
            }
            await this.prisma.onboardingCommunication.update({
                where: { id: communicationId },
                data: { readAt: new Date() },
            });
            return { success: true };
        }
        async markAllAsRead(tenantId) {
            const onboarding = await this.prisma.tenantOnboarding.findUnique({
                where: { tenantId },
            });
            if (!onboarding) {
                throw new common_1.NotFoundException('Onboarding no encontrado');
            }
            await this.prisma.onboardingCommunication.updateMany({
                where: {
                    onboardingId: onboarding.id,
                    direction: 'INCOMING',
                    readAt: null,
                },
                data: { readAt: new Date() },
            });
            return { success: true };
        }
        // =========================================================================
        // ADMIN: GET ALL COMMUNICATIONS
        // =========================================================================
        async getAllCommunications(page = 1, limit = 50) {
            const skip = (page - 1) * limit;
            const [communications, total] = await Promise.all([
                this.prisma.onboardingCommunication.findMany({
                    include: {
                        onboarding: {
                            select: {
                                tenantId: true,
                                razonSocial: true,
                                tenant: {
                                    select: { nombre: true },
                                },
                            },
                        },
                    },
                    orderBy: { sentAt: 'desc' },
                    skip,
                    take: limit,
                }),
                this.prisma.onboardingCommunication.count(),
            ]);
            return {
                communications: communications.map((c) => ({
                    id: c.id,
                    tenantId: c.onboarding.tenantId,
                    tenantName: c.onboarding.tenant.nombre || c.onboarding.razonSocial,
                    type: c.type,
                    direction: c.direction,
                    subject: c.subject,
                    content: c.content,
                    attachments: c.attachments ? JSON.parse(c.attachments) : [],
                    relatedStep: c.relatedStep,
                    sentBy: c.sentBy,
                    sentAt: c.sentAt,
                    readAt: c.readAt,
                })),
                total,
                page,
                totalPages: Math.ceil(total / limit),
            };
        }
    };
    return OnboardingCommunicationService = _classThis;
})();
exports.OnboardingCommunicationService = OnboardingCommunicationService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const recurring_invoices_service_1 = require("./recurring-invoices.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const mock_prisma_1 = require("../../test/helpers/mock-prisma");
const test_fixtures_1 = require("../../test/helpers/test-fixtures");
describe('RecurringInvoicesService', () => {
    let service;
    let prisma;
    beforeEach(async () => {
        prisma = (0, mock_prisma_1.createMockPrismaService)();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                recurring_invoices_service_1.RecurringInvoicesService,
                { provide: prisma_service_1.PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get(recurring_invoices_service_1.RecurringInvoicesService);
    });
    describe('create', () => {
        const dto = {
            nombre: 'Mensualidad',
            clienteId: 'cliente-1',
            interval: 'MONTHLY',
            anchorDay: 15,
            items: [{ descripcion: 'Hosting', cantidad: 1, precioUnitario: 50, descuento: 0 }],
            startDate: '2025-01-01',
        };
        it('should create template with nextRunDate calculated', async () => {
            prisma.cliente.findFirst.mockResolvedValue((0, test_fixtures_1.createMockCliente)());
            const created = (0, test_fixtures_1.createMockTemplate)();
            prisma.recurringInvoiceTemplate.create.mockResolvedValue(created);
            const result = await service.create('tenant-1', dto);
            expect(result).toEqual(created);
            expect(prisma.recurringInvoiceTemplate.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    tenantId: 'tenant-1',
                    nombre: 'Mensualidad',
                    clienteId: 'cliente-1',
                    items: JSON.stringify(dto.items),
                }),
            }));
        });
        it('should throw NotFoundException when cliente does not belong to tenant', async () => {
            prisma.cliente.findFirst.mockResolvedValue(null);
            await expect(service.create('tenant-1', dto)).rejects.toThrow(common_1.NotFoundException);
        });
        it('should stringify items to JSON', async () => {
            prisma.cliente.findFirst.mockResolvedValue((0, test_fixtures_1.createMockCliente)());
            prisma.recurringInvoiceTemplate.create.mockResolvedValue((0, test_fixtures_1.createMockTemplate)());
            await service.create('tenant-1', dto);
            expect(prisma.recurringInvoiceTemplate.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    items: JSON.stringify(dto.items),
                }),
            }));
        });
        it('should use defaults for tipoDte and mode', async () => {
            prisma.cliente.findFirst.mockResolvedValue((0, test_fixtures_1.createMockCliente)());
            prisma.recurringInvoiceTemplate.create.mockResolvedValue((0, test_fixtures_1.createMockTemplate)());
            await service.create('tenant-1', dto);
            expect(prisma.recurringInvoiceTemplate.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    tipoDte: '01',
                    mode: 'AUTO_DRAFT',
                    autoTransmit: false,
                }),
            }));
        });
    });
    describe('findAll', () => {
        it('should return paginated templates with cliente relation', async () => {
            const templates = [{ ...(0, test_fixtures_1.createMockTemplate)(), cliente: (0, test_fixtures_1.createMockCliente)(), _count: { history: 5 } }];
            prisma.recurringInvoiceTemplate.findMany.mockResolvedValue(templates);
            prisma.recurringInvoiceTemplate.count.mockResolvedValue(1);
            const result = await service.findAll('tenant-1', {});
            expect(result.data).toEqual(templates);
            expect(result.total).toBe(1);
            expect(prisma.recurringInvoiceTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({
                include: expect.objectContaining({
                    cliente: expect.anything(),
                }),
            }));
        });
        it('should filter by status when provided', async () => {
            prisma.recurringInvoiceTemplate.findMany.mockResolvedValue([]);
            prisma.recurringInvoiceTemplate.count.mockResolvedValue(0);
            await service.findAll('tenant-1', { status: 'PAUSED' });
            expect(prisma.recurringInvoiceTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ status: 'PAUSED' }),
            }));
        });
        it('should filter by search', async () => {
            prisma.recurringInvoiceTemplate.findMany.mockResolvedValue([]);
            prisma.recurringInvoiceTemplate.count.mockResolvedValue(0);
            await service.findAll('tenant-1', { search: 'hosting' });
            expect(prisma.recurringInvoiceTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    OR: expect.arrayContaining([
                        { nombre: { contains: 'hosting' } },
                    ]),
                }),
            }));
        });
        it('should sort by allowed fields and default to createdAt', async () => {
            prisma.recurringInvoiceTemplate.findMany.mockResolvedValue([]);
            prisma.recurringInvoiceTemplate.count.mockResolvedValue(0);
            await service.findAll('tenant-1', { sortBy: 'invalidField' });
            expect(prisma.recurringInvoiceTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { createdAt: 'desc' },
            }));
        });
    });
    describe('pause', () => {
        it('should set status to PAUSED from ACTIVE', async () => {
            prisma.recurringInvoiceTemplate.findFirst.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'ACTIVE' }));
            prisma.recurringInvoiceTemplate.update.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'PAUSED' }));
            const result = await service.pause('tenant-1', 'template-1');
            expect(result.status).toBe('PAUSED');
            expect(prisma.recurringInvoiceTemplate.update).toHaveBeenCalledWith({
                where: { id: 'template-1' },
                data: { status: 'PAUSED' },
            });
        });
        it('should set status to PAUSED from SUSPENDED_ERROR', async () => {
            prisma.recurringInvoiceTemplate.findFirst.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'SUSPENDED_ERROR' }));
            prisma.recurringInvoiceTemplate.update.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'PAUSED' }));
            await service.pause('tenant-1', 'template-1');
            expect(prisma.recurringInvoiceTemplate.update).toHaveBeenCalled();
        });
        it('should throw BadRequestException from PAUSED state', async () => {
            prisma.recurringInvoiceTemplate.findFirst.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'PAUSED' }));
            await expect(service.pause('tenant-1', 'template-1')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException when template not found', async () => {
            prisma.recurringInvoiceTemplate.findFirst.mockResolvedValue(null);
            await expect(service.pause('tenant-1', 'nonexistent')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('resume', () => {
        it('should set status to ACTIVE from PAUSED and reset failures', async () => {
            prisma.recurringInvoiceTemplate.findFirst.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'PAUSED', consecutiveFailures: 2 }));
            prisma.recurringInvoiceTemplate.update.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'ACTIVE', consecutiveFailures: 0 }));
            const result = await service.resume('tenant-1', 'template-1');
            expect(result.status).toBe('ACTIVE');
            expect(prisma.recurringInvoiceTemplate.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'ACTIVE',
                    consecutiveFailures: 0,
                    lastError: null,
                }),
            }));
        });
        it('should throw BadRequestException from ACTIVE state', async () => {
            prisma.recurringInvoiceTemplate.findFirst.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'ACTIVE' }));
            await expect(service.resume('tenant-1', 'template-1')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('cancel', () => {
        it('should set status to CANCELLED', async () => {
            prisma.recurringInvoiceTemplate.findFirst.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'ACTIVE' }));
            prisma.recurringInvoiceTemplate.update.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'CANCELLED' }));
            const result = await service.cancel('tenant-1', 'template-1');
            expect(result.status).toBe('CANCELLED');
        });
        it('should throw BadRequestException if already CANCELLED', async () => {
            prisma.recurringInvoiceTemplate.findFirst.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ status: 'CANCELLED' }));
            await expect(service.cancel('tenant-1', 'template-1')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('recordSuccess', () => {
        it('should create history entry and update template in transaction', async () => {
            prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue((0, test_fixtures_1.createMockTemplate)());
            await service.recordSuccess('template-1', 'dte-1');
            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.recurringInvoiceHistory.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    templateId: 'template-1',
                    dteId: 'dte-1',
                    status: 'SUCCESS',
                }),
            }));
        });
        it('should reset consecutiveFailures to 0', async () => {
            prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ consecutiveFailures: 2 }));
            await service.recordSuccess('template-1', 'dte-1');
            expect(prisma.recurringInvoiceTemplate.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    consecutiveFailures: 0,
                    lastError: null,
                }),
            }));
        });
        it('should return early if template not found', async () => {
            prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue(null);
            await service.recordSuccess('nonexistent', 'dte-1');
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });
    });
    describe('recordFailure', () => {
        it('should increment consecutiveFailures', async () => {
            prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ consecutiveFailures: 1 }));
            await service.recordFailure('template-1', 'Error msg');
            expect(prisma.recurringInvoiceTemplate.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    consecutiveFailures: 2,
                    lastError: 'Error msg',
                }),
            }));
        });
        it('should suspend template after 3 consecutive failures', async () => {
            prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ consecutiveFailures: 2 }));
            await service.recordFailure('template-1', 'Third failure');
            expect(prisma.recurringInvoiceTemplate.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    consecutiveFailures: 3,
                    status: 'SUSPENDED_ERROR',
                }),
            }));
        });
        it('should keep ACTIVE status with fewer than 3 failures', async () => {
            prisma.recurringInvoiceTemplate.findUnique.mockResolvedValue((0, test_fixtures_1.createMockTemplate)({ consecutiveFailures: 0 }));
            await service.recordFailure('template-1', 'First failure');
            expect(prisma.recurringInvoiceTemplate.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    consecutiveFailures: 1,
                    status: 'ACTIVE',
                }),
            }));
        });
    });
    describe('calculateNextRunDate', () => {
        it('should return tomorrow 01:00 UTC for DAILY', () => {
            const result = service.calculateNextRunDate({
                interval: 'DAILY',
                startDate: new Date('2025-01-15T00:00:00Z'),
            });
            expect(result.getUTCHours()).toBe(1);
            expect(result.getUTCMinutes()).toBe(0);
            expect(result > new Date()).toBe(true);
        });
        it('should calculate next target day for WEEKLY', () => {
            // Start on a Wednesday (2025-01-15), target Monday (dayOfWeek=1)
            const result = service.calculateNextRunDate({
                interval: 'WEEKLY',
                dayOfWeek: 1,
                startDate: new Date('2025-01-15T00:00:00Z'),
            });
            expect(result.getUTCDay()).toBe(1); // Monday
            expect(result.getUTCHours()).toBe(1);
        });
        it('should calculate next month with anchorDay for MONTHLY', () => {
            const result = service.calculateNextRunDate({
                interval: 'MONTHLY',
                anchorDay: 15,
                startDate: new Date('2025-01-01T00:00:00Z'),
            });
            expect(result.getUTCDate()).toBe(15);
            expect(result.getUTCHours()).toBe(1);
        });
        it('should clamp anchorDay to month end for short months', () => {
            // Use a future January date so next month is February (28 days)
            const result = service.calculateNextRunDate({
                interval: 'MONTHLY',
                anchorDay: 31,
                startDate: new Date('2027-01-15T00:00:00Z'),
            });
            // February 2027 has 28 days, anchorDay=31 should clamp to 28
            expect(result.getUTCMonth()).toBe(1); // February (0-indexed)
            expect(result.getUTCDate()).toBe(28);
        });
        it('should add one year for YEARLY', () => {
            const start = new Date('2025-06-15T00:00:00Z');
            const result = service.calculateNextRunDate({
                interval: 'YEARLY',
                startDate: start,
            });
            expect(result.getUTCFullYear()).toBeGreaterThan(start.getUTCFullYear());
            expect(result.getUTCHours()).toBe(1);
        });
    });
    describe('getDueTemplates', () => {
        it('should find ACTIVE templates with nextRunDate <= now', async () => {
            const templates = [(0, test_fixtures_1.createMockTemplate)({ nextRunDate: new Date('2020-01-01') })];
            prisma.recurringInvoiceTemplate.findMany.mockResolvedValue(templates);
            const result = await service.getDueTemplates();
            expect(result).toEqual(templates);
            expect(prisma.recurringInvoiceTemplate.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: 'ACTIVE',
                    nextRunDate: expect.objectContaining({ lte: expect.any(Date) }),
                }),
            }));
        });
    });
    describe('getHistory', () => {
        it('should return paginated history for a template', async () => {
            prisma.recurringInvoiceTemplate.findFirst.mockResolvedValue((0, test_fixtures_1.createMockTemplate)());
            prisma.recurringInvoiceHistory.findMany.mockResolvedValue([]);
            prisma.recurringInvoiceHistory.count.mockResolvedValue(0);
            const result = await service.getHistory('tenant-1', 'template-1', { page: 1, limit: 20 });
            expect(result).toEqual({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0,
            });
        });
        it('should throw NotFoundException when template not found', async () => {
            prisma.recurringInvoiceTemplate.findFirst.mockResolvedValue(null);
            await expect(service.getHistory('tenant-1', 'nonexistent', {})).rejects.toThrow(common_1.NotFoundException);
        });
    });
});

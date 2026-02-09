"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const dte_service_1 = require("./dte.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const signer_service_1 = require("../signer/signer.service");
const mh_auth_service_1 = require("../mh-auth/mh-auth.service");
const mock_prisma_1 = require("../../test/helpers/mock-prisma");
const test_fixtures_1 = require("../../test/helpers/test-fixtures");
describe('DteService', () => {
    let service;
    let prisma;
    beforeEach(async () => {
        prisma = (0, mock_prisma_1.createMockPrismaService)();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                dte_service_1.DteService,
                { provide: prisma_service_1.PrismaService, useValue: prisma },
                { provide: signer_service_1.SignerService, useValue: { signDocument: jest.fn() } },
                { provide: mh_auth_service_1.MhAuthService, useValue: { getToken: jest.fn() } },
            ],
        }).compile();
        service = module.get(dte_service_1.DteService);
    });
    describe('findByTenant', () => {
        it('should return empty results when tenantId is null', async () => {
            const result = await service.findByTenant(null);
            expect(result).toEqual({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0,
            });
            expect(prisma.dTE.findMany).not.toHaveBeenCalled();
        });
        it('should return empty results when tenantId is undefined', async () => {
            const result = await service.findByTenant(undefined);
            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
            expect(prisma.dTE.findMany).not.toHaveBeenCalled();
        });
        it('should return paginated DTEs for valid tenantId', async () => {
            const dtes = [(0, test_fixtures_1.createMockDte)(), (0, test_fixtures_1.createMockDte)({ id: 'dte-2' })];
            prisma.dTE.findMany.mockResolvedValue(dtes);
            prisma.dTE.count.mockResolvedValue(2);
            const result = await service.findByTenant('tenant-1', 1, 20);
            expect(result.data).toEqual(dtes);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.totalPages).toBe(1);
        });
        it('should filter by tipoDte when provided', async () => {
            prisma.dTE.findMany.mockResolvedValue([]);
            prisma.dTE.count.mockResolvedValue(0);
            await service.findByTenant('tenant-1', 1, 20, { tipoDte: '01' });
            expect(prisma.dTE.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ tenantId: 'tenant-1', tipoDte: '01' }),
            }));
        });
        it('should filter by estado when provided', async () => {
            prisma.dTE.findMany.mockResolvedValue([]);
            prisma.dTE.count.mockResolvedValue(0);
            await service.findByTenant('tenant-1', 1, 20, { estado: 'PROCESADO' });
            expect(prisma.dTE.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ estado: 'PROCESADO' }),
            }));
        });
        it('should sort by allowed field (totalPagar)', async () => {
            prisma.dTE.findMany.mockResolvedValue([]);
            prisma.dTE.count.mockResolvedValue(0);
            await service.findByTenant('tenant-1', 1, 20, {}, 'totalPagar', 'asc');
            expect(prisma.dTE.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { totalPagar: 'asc' },
            }));
        });
        it('should fallback to createdAt for invalid sortBy', async () => {
            prisma.dTE.findMany.mockResolvedValue([]);
            prisma.dTE.count.mockResolvedValue(0);
            await service.findByTenant('tenant-1', 1, 20, {}, 'hackedField');
            expect(prisma.dTE.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { createdAt: 'desc' },
            }));
        });
        it('should include cliente relation in results', async () => {
            prisma.dTE.findMany.mockResolvedValue([]);
            prisma.dTE.count.mockResolvedValue(0);
            await service.findByTenant('tenant-1');
            expect(prisma.dTE.findMany).toHaveBeenCalledWith(expect.objectContaining({
                include: { cliente: true },
            }));
        });
    });
});

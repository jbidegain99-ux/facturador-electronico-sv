"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const passport_1 = require("@nestjs/passport");
const dte_controller_1 = require("./dte.controller");
const dte_service_1 = require("./dte.service");
const pdf_service_1 = require("./pdf.service");
const mock_user_1 = require("../../test/helpers/mock-user");
describe('DteController', () => {
    let controller;
    let mockDteService;
    const mockUser = (0, mock_user_1.createMockUser)();
    beforeEach(async () => {
        mockDteService = {
            createDte: jest.fn(),
            signDte: jest.fn(),
            transmitDte: jest.fn(),
            findByTenant: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
            findOne: jest.fn(),
            getSummaryStats: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            controllers: [dte_controller_1.DteController],
            providers: [
                { provide: dte_service_1.DteService, useValue: mockDteService },
                { provide: pdf_service_1.PdfService, useValue: { generatePdf: jest.fn() } },
            ],
        })
            .overrideGuard((0, passport_1.AuthGuard)('jwt'))
            .useValue((0, mock_user_1.createMockAuthGuard)(mockUser))
            .compile();
        controller = module.get(dte_controller_1.DteController);
    });
    describe('findAll', () => {
        it('should parse page and limit from query strings', async () => {
            const mockReq = { user: { tenantId: 'tenant-1' } };
            await controller.findAll(mockReq, '2', '10', undefined, undefined, undefined, undefined, undefined);
            expect(mockDteService.findByTenant).toHaveBeenCalledWith('tenant-1', 2, 10, { tipoDte: undefined, estado: undefined, search: undefined }, undefined, undefined);
        });
        it('should cap limit at 100', async () => {
            const mockReq = { user: { tenantId: 'tenant-1' } };
            await controller.findAll(mockReq, '1', '500', undefined, undefined, undefined, undefined, undefined);
            expect(mockDteService.findByTenant).toHaveBeenCalledWith('tenant-1', 1, 100, expect.anything(), undefined, undefined);
        });
        it('should pass filters to service', async () => {
            const mockReq = { user: { tenantId: 'tenant-1' } };
            await controller.findAll(mockReq, undefined, undefined, '01', 'PROCESADO', 'test', undefined, undefined);
            expect(mockDteService.findByTenant).toHaveBeenCalledWith('tenant-1', 1, 20, { tipoDte: '01', estado: 'PROCESADO', search: 'test' }, undefined, undefined);
        });
        it('should pass sortBy and sortOrder to service', async () => {
            const mockReq = { user: { tenantId: 'tenant-1' } };
            await controller.findAll(mockReq, undefined, undefined, undefined, undefined, undefined, 'totalPagar', 'asc');
            expect(mockDteService.findByTenant).toHaveBeenCalledWith('tenant-1', 1, 20, expect.anything(), 'totalPagar', 'asc');
        });
        it('should default limit to 20 when not provided', async () => {
            const mockReq = { user: { tenantId: 'tenant-1' } };
            await controller.findAll(mockReq, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
            expect(mockDteService.findByTenant).toHaveBeenCalledWith('tenant-1', 1, 20, expect.anything(), undefined, undefined);
        });
    });
});

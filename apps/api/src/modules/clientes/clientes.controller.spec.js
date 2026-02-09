"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const clientes_controller_1 = require("./clientes.controller");
const clientes_service_1 = require("./clientes.service");
const mock_user_1 = require("../../test/helpers/mock-user");
const test_fixtures_1 = require("../../test/helpers/test-fixtures");
describe('ClientesController', () => {
    let controller;
    let mockService;
    const mockUser = (0, mock_user_1.createMockUser)();
    beforeEach(async () => {
        mockService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            controllers: [clientes_controller_1.ClientesController],
            providers: [{ provide: clientes_service_1.ClientesService, useValue: mockService }],
        })
            .overrideGuard((0, passport_1.AuthGuard)('jwt'))
            .useValue((0, mock_user_1.createMockAuthGuard)(mockUser))
            .compile();
        controller = module.get(clientes_controller_1.ClientesController);
    });
    describe('findAll', () => {
        it('should call service.findAll with tenantId and query', async () => {
            const query = { page: 1, limit: 10 };
            const expected = { data: [(0, test_fixtures_1.createMockCliente)()], total: 1, page: 1, limit: 10, totalPages: 1 };
            mockService.findAll.mockResolvedValue(expected);
            const result = await controller.findAll(mockUser, query);
            expect(result).toEqual(expected);
            expect(mockService.findAll).toHaveBeenCalledWith('tenant-1', query);
        });
        it('should throw ForbiddenException when user has no tenantId', async () => {
            const userWithoutTenant = (0, mock_user_1.createMockUserWithoutTenant)();
            await expect(controller.findAll(userWithoutTenant, {})).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('create', () => {
        it('should call service.create with tenantId and dto', async () => {
            const dto = { tipoDocumento: '36', numDocumento: '0614', nombre: 'Test', direccion: { departamento: '06', municipio: '14', complemento: 'Calle' } };
            const expected = (0, test_fixtures_1.createMockCliente)();
            mockService.create.mockResolvedValue(expected);
            const result = await controller.create(mockUser, dto);
            expect(result).toEqual(expected);
            expect(mockService.create).toHaveBeenCalledWith('tenant-1', dto);
        });
        it('should throw ForbiddenException when user has no tenantId', async () => {
            const userWithoutTenant = (0, mock_user_1.createMockUserWithoutTenant)();
            const dto = { tipoDocumento: '36', numDocumento: '0614', nombre: 'Test', direccion: { departamento: '06', municipio: '14', complemento: 'Calle' } };
            await expect(controller.create(userWithoutTenant, dto)).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('findOne', () => {
        it('should call service.findOne with tenantId and id', async () => {
            const expected = (0, test_fixtures_1.createMockCliente)();
            mockService.findOne.mockResolvedValue(expected);
            const result = await controller.findOne(mockUser, 'cliente-1');
            expect(result).toEqual(expected);
            expect(mockService.findOne).toHaveBeenCalledWith('tenant-1', 'cliente-1');
        });
    });
    describe('update', () => {
        it('should call service.update with tenantId, id, and dto', async () => {
            const dto = { nombre: 'Updated' };
            const expected = (0, test_fixtures_1.createMockCliente)({ nombre: 'Updated' });
            mockService.update.mockResolvedValue(expected);
            const result = await controller.update(mockUser, 'cliente-1', dto);
            expect(result).toEqual(expected);
            expect(mockService.update).toHaveBeenCalledWith('tenant-1', 'cliente-1', dto);
        });
    });
    describe('remove', () => {
        it('should call service.remove with tenantId and id', async () => {
            mockService.remove.mockResolvedValue({ message: 'Eliminado' });
            const result = await controller.remove(mockUser, 'cliente-1');
            expect(result).toEqual({ message: 'Eliminado' });
            expect(mockService.remove).toHaveBeenCalledWith('tenant-1', 'cliente-1');
        });
    });
});

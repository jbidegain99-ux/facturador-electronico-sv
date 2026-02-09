import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { createMockUser, createMockUserWithoutTenant, createMockAuthGuard } from '../../test/helpers/mock-user';
import { createMockCliente } from '../../test/helpers/test-fixtures';

describe('ClientesController', () => {
  let controller: ClientesController;
  let mockService: Record<string, jest.Mock>;
  const mockUser = createMockUser();

  beforeEach(async () => {
    mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [{ provide: ClientesService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(createMockAuthGuard(mockUser))
      .compile();

    controller = module.get<ClientesController>(ClientesController);
  });

  describe('findAll', () => {
    it('should call service.findAll with tenantId and query', async () => {
      const query = { page: 1, limit: 10 };
      const expected = { data: [createMockCliente()], total: 1, page: 1, limit: 10, totalPages: 1 };
      mockService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser, query);

      expect(result).toEqual(expected);
      expect(mockService.findAll).toHaveBeenCalledWith('tenant-1', query);
    });

    it('should throw ForbiddenException when user has no tenantId', async () => {
      const userWithoutTenant = createMockUserWithoutTenant();

      await expect(
        controller.findAll(userWithoutTenant, {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should call service.create with tenantId and dto', async () => {
      const dto = { tipoDocumento: '36', numDocumento: '0614', nombre: 'Test', direccion: { departamento: '06', municipio: '14', complemento: 'Calle' } };
      const expected = createMockCliente();
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(mockUser, dto as Parameters<typeof controller.create>[1]);

      expect(result).toEqual(expected);
      expect(mockService.create).toHaveBeenCalledWith('tenant-1', dto);
    });

    it('should throw ForbiddenException when user has no tenantId', async () => {
      const userWithoutTenant = createMockUserWithoutTenant();
      const dto = { tipoDocumento: '36', numDocumento: '0614', nombre: 'Test', direccion: { departamento: '06', municipio: '14', complemento: 'Calle' } };

      await expect(
        controller.create(userWithoutTenant, dto as Parameters<typeof controller.create>[1]),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with tenantId and id', async () => {
      const expected = createMockCliente();
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUser, 'cliente-1');

      expect(result).toEqual(expected);
      expect(mockService.findOne).toHaveBeenCalledWith('tenant-1', 'cliente-1');
    });
  });

  describe('update', () => {
    it('should call service.update with tenantId, id, and dto', async () => {
      const dto = { nombre: 'Updated' };
      const expected = createMockCliente({ nombre: 'Updated' });
      mockService.update.mockResolvedValue(expected);

      const result = await controller.update(mockUser, 'cliente-1', dto as Parameters<typeof controller.update>[2]);

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

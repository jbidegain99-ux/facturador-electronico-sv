import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecurringInvoicesController } from './recurring-invoices.controller';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { createMockUser, createMockUserWithoutTenant, createMockAuthGuard } from '../../test/helpers/mock-user';
import { createMockTemplate } from '../../test/helpers/test-fixtures';

describe('RecurringInvoicesController', () => {
  let controller: RecurringInvoicesController;
  let mockService: Record<string, jest.Mock>;
  const mockUser = createMockUser();

  beforeEach(async () => {
    mockService = {
      create: jest.fn(),
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
      findOne: jest.fn(),
      update: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      cancel: jest.fn(),
      getHistory: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringInvoicesController],
      providers: [{ provide: RecurringInvoicesService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(createMockAuthGuard(mockUser))
      .compile();

    controller = module.get<RecurringInvoicesController>(RecurringInvoicesController);
  });

  describe('create', () => {
    it('should call service.create with tenantId and dto', async () => {
      const dto = {
        nombre: 'Mensualidad',
        clienteId: 'cliente-1',
        interval: 'MONTHLY',
        items: [{ descripcion: 'Test', cantidad: 1, precioUnitario: 50, descuento: 0 }],
        startDate: '2025-01-01',
      };
      const expected = createMockTemplate();
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(mockUser, dto as Parameters<typeof controller.create>[1]);

      expect(result).toEqual(expected);
      expect(mockService.create).toHaveBeenCalledWith('tenant-1', dto);
    });

    it('should throw ForbiddenException when user has no tenantId', async () => {
      const userWithoutTenant = createMockUserWithoutTenant();
      const dto = {
        nombre: 'Test',
        clienteId: 'c-1',
        interval: 'MONTHLY',
        items: [],
        startDate: '2025-01-01',
      };

      await expect(
        controller.create(userWithoutTenant, dto as Parameters<typeof controller.create>[1]),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with tenantId and query', async () => {
      const query = { page: 1, limit: 10 };
      await controller.findAll(mockUser, query as Parameters<typeof controller.findAll>[1], undefined);

      expect(mockService.findAll).toHaveBeenCalledWith('tenant-1', { ...query, status: undefined });
    });

    it('should pass status filter', async () => {
      await controller.findAll(mockUser, {} as Parameters<typeof controller.findAll>[1], 'PAUSED');

      expect(mockService.findAll).toHaveBeenCalledWith('tenant-1', { status: 'PAUSED' });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with tenantId and id', async () => {
      const expected = createMockTemplate();
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUser, 'template-1');

      expect(result).toEqual(expected);
      expect(mockService.findOne).toHaveBeenCalledWith('tenant-1', 'template-1');
    });
  });

  describe('update', () => {
    it('should call service.update with tenantId, id, and dto', async () => {
      const dto = { nombre: 'Updated' };
      const expected = createMockTemplate({ nombre: 'Updated' });
      mockService.update.mockResolvedValue(expected);

      const result = await controller.update(mockUser, 'template-1', dto as Parameters<typeof controller.update>[2]);

      expect(result).toEqual(expected);
      expect(mockService.update).toHaveBeenCalledWith('tenant-1', 'template-1', dto);
    });
  });

  describe('pause', () => {
    it('should call service.pause with tenantId and id', async () => {
      const expected = createMockTemplate({ status: 'PAUSED' });
      mockService.pause.mockResolvedValue(expected);

      const result = await controller.pause(mockUser, 'template-1');

      expect(result).toEqual(expected);
      expect(mockService.pause).toHaveBeenCalledWith('tenant-1', 'template-1');
    });
  });

  describe('resume', () => {
    it('should call service.resume with tenantId and id', async () => {
      const expected = createMockTemplate({ status: 'ACTIVE' });
      mockService.resume.mockResolvedValue(expected);

      const result = await controller.resume(mockUser, 'template-1');

      expect(result).toEqual(expected);
      expect(mockService.resume).toHaveBeenCalledWith('tenant-1', 'template-1');
    });
  });

  describe('cancel', () => {
    it('should call service.cancel with tenantId and id', async () => {
      const expected = createMockTemplate({ status: 'CANCELLED' });
      mockService.cancel.mockResolvedValue(expected);

      const result = await controller.cancel(mockUser, 'template-1');

      expect(result).toEqual(expected);
      expect(mockService.cancel).toHaveBeenCalledWith('tenant-1', 'template-1');
    });
  });

  describe('trigger', () => {
    it('should call service.findOne and return confirmation', async () => {
      const template = createMockTemplate();
      mockService.findOne.mockResolvedValue(template);

      const result = await controller.trigger(mockUser, 'template-1');

      expect(result).toEqual({
        message: 'Template encolado para ejecucion',
        templateId: template.id,
      });
      expect(mockService.findOne).toHaveBeenCalledWith('tenant-1', 'template-1');
    });

    it('should throw ForbiddenException when user has no tenantId', async () => {
      const userWithoutTenant = createMockUserWithoutTenant();

      await expect(
        controller.trigger(userWithoutTenant, 'template-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getHistory', () => {
    it('should call service.getHistory with tenantId, id, and query', async () => {
      const query = { page: 1, limit: 20 };
      await controller.getHistory(mockUser, 'template-1', query as Parameters<typeof controller.getHistory>[2]);

      expect(mockService.getHistory).toHaveBeenCalledWith('tenant-1', 'template-1', query);
    });
  });
});

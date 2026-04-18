import { Test } from '@nestjs/testing';
import { HttpStatus, BadRequestException } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './services/purchases.service';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';

describe('PurchasesController', () => {
  let controller: PurchasesController;
  let service: jest.Mocked<PurchasesService>;

  const mockUser: CurrentUserData = {
    tenantId: 't1',
    id: 'u1',
    email: 'test@example.com',
    rol: 'admin',
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PurchasesController],
      providers: [
        {
          provide: PurchasesService,
          useValue: {
            createManual: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            postDraft: jest.fn(),
            pay: jest.fn(),
            anular: jest.fn(),
            receiveLate: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(PurchasesController);
    service = module.get(PurchasesService);
  });

  describe('POST /purchases', () => {
    it('delegates to service.createManual with tenantId, userId, and dto', async () => {
      const dto = {
        proveedorId: 'p1',
        tipoDoc: 'FC',
        numDocumentoProveedor: '123',
        fechaDoc: '2026-04-18',
        fechaContable: '2026-04-18',
        lineas: [],
        estadoInicial: 'DRAFT',
      } as any;

      service.createManual.mockResolvedValue({ id: 'purchase1' } as any);

      const result = await controller.create(mockUser, dto);

      expect(service.createManual).toHaveBeenCalledWith('t1', 'u1', dto);
      expect(result).toEqual({ id: 'purchase1' });
    });

    it('returns created purchase', async () => {
      const dto = {} as any;
      const expected = { id: 'purchase1', proveedorId: 'p1' } as any;

      service.createManual.mockResolvedValue(expected);

      const result = await controller.create(mockUser, dto);

      expect(result).toEqual(expected);
    });
  });

  describe('GET /purchases', () => {
    it('delegates to service.findAll with filters', async () => {
      service.findAll.mockResolvedValue({
        data: [],
        total: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
      } as any);

      await controller.findAll(
        mockUser,
        '1',
        '10',
        'p1',
        'DRAFT',
        '2026-04-01',
        '2026-04-30',
      );

      expect(service.findAll).toHaveBeenCalledWith('t1', {
        page: 1,
        limit: 10,
        proveedorId: 'p1',
        estado: 'DRAFT',
        desde: '2026-04-01',
        hasta: '2026-04-30',
      });
    });

    it('passes numeric page and limit when provided', async () => {
      service.findAll.mockResolvedValue({
        data: [],
        total: 0,
        totalPages: 0,
        page: 2,
        limit: 20,
      } as any);

      await controller.findAll(mockUser, '2', '20');

      expect(service.findAll).toHaveBeenCalledWith('t1', {
        page: 2,
        limit: 20,
        proveedorId: undefined,
        estado: undefined,
        desde: undefined,
        hasta: undefined,
      });
    });

    it('handles undefined pagination params', async () => {
      service.findAll.mockResolvedValue({
        data: [],
        total: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
      } as any);

      await controller.findAll(mockUser, undefined, undefined);

      expect(service.findAll).toHaveBeenCalledWith('t1', {
        page: undefined,
        limit: undefined,
        proveedorId: undefined,
        estado: undefined,
        desde: undefined,
        hasta: undefined,
      });
    });
  });

  describe('GET /purchases/:id', () => {
    it('delegates to service.findOne', async () => {
      const expected = { id: 'purchase1', proveedorId: 'p1' } as any;
      service.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUser, 'purchase1');

      expect(service.findOne).toHaveBeenCalledWith('t1', 'purchase1');
      expect(result).toEqual(expected);
    });

    it('returns purchase with relations', async () => {
      const expected = {
        id: 'purchase1',
        proveedorId: 'p1',
        lineItems: [],
        supplier: {},
      } as any;

      service.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUser, 'purchase1');

      expect(result).toEqual(expected);
    });
  });

  describe('PATCH /purchases/:id', () => {
    it('delegates to service.update', async () => {
      const dto = { tipoDoc: 'FC', numDocumentoProveedor: '456' } as any;
      const expected = { id: 'purchase1', ...dto } as any;

      service.update.mockResolvedValue(expected);

      const result = await controller.update(mockUser, 'purchase1', dto);

      expect(service.update).toHaveBeenCalledWith('t1', 'purchase1', dto);
      expect(result).toEqual(expected);
    });

    it('returns updated purchase', async () => {
      const dto = {} as any;
      const expected = { id: 'purchase1', updated: true } as any;

      service.update.mockResolvedValue(expected);

      const result = await controller.update(mockUser, 'purchase1', dto);

      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /purchases/:id', () => {
    it('delegates to service.softDelete', async () => {
      service.softDelete.mockResolvedValue(undefined);

      await controller.delete(mockUser, 'purchase1');

      expect(service.softDelete).toHaveBeenCalledWith('t1', 'purchase1');
    });

    it('returns no content', async () => {
      service.softDelete.mockResolvedValue(undefined);

      const result = await controller.delete(mockUser, 'purchase1');

      expect(result).toBeUndefined();
    });
  });

  describe('POST /purchases/:id/post', () => {
    it('delegates to service.postDraft with tenantId, userId', async () => {
      const dto = { numeroControl: '0001', serieControl: 'A' } as any;
      const expected = { id: 'purchase1', estado: 'POSTED' } as any;

      service.postDraft.mockResolvedValue(expected);

      const result = await controller.post(mockUser, 'purchase1', dto);

      expect(service.postDraft).toHaveBeenCalledWith('t1', 'u1', 'purchase1', dto);
      expect(result).toEqual(expected);
    });

    it('returns posted purchase', async () => {
      const dto = {} as any;
      const expected = { id: 'purchase1', estado: 'POSTED' } as any;

      service.postDraft.mockResolvedValue(expected);

      const result = await controller.post(mockUser, 'purchase1', dto);

      expect(result).toEqual(expected);
    });
  });

  describe('POST /purchases/:id/pay', () => {
    it('delegates to service.pay with tenantId, userId', async () => {
      const dto = { cuentaPagoId: 'acc1', fechaPago: '2026-04-18' } as any;
      const expected = { id: 'purchase1', estado: 'PAID' } as any;

      service.pay.mockResolvedValue(expected);

      const result = await controller.pay(mockUser, 'purchase1', dto);

      expect(service.pay).toHaveBeenCalledWith('t1', 'u1', 'purchase1', dto);
      expect(result).toEqual(expected);
    });

    it('returns paid purchase', async () => {
      const dto = {} as any;
      const expected = { id: 'purchase1', estado: 'PAID' } as any;

      service.pay.mockResolvedValue(expected);

      const result = await controller.pay(mockUser, 'purchase1', dto);

      expect(result).toEqual(expected);
    });
  });

  describe('POST /purchases/:id/anular', () => {
    it('delegates to service.anular with tenantId, userId', async () => {
      const dto = { motivo: 'error' } as any;
      const expected = { id: 'purchase1', estado: 'ANULADA' } as any;

      service.anular.mockResolvedValue(expected);

      const result = await controller.anular(mockUser, 'purchase1', dto);

      expect(service.anular).toHaveBeenCalledWith('t1', 'u1', 'purchase1', dto);
      expect(result).toEqual(expected);
    });

    it('returns anulada purchase', async () => {
      const dto = {} as any;
      const expected = { id: 'purchase1', estado: 'ANULADA' } as any;

      service.anular.mockResolvedValue(expected);

      const result = await controller.anular(mockUser, 'purchase1', dto);

      expect(result).toEqual(expected);
    });
  });

  describe('POST /purchases/:id/receive', () => {
    it('delegates to service.receiveLate with tenantId, userId', async () => {
      const dto = {
        codigo: 'DTE001',
        fechaRecepcion: '2026-04-18',
      } as any;
      const expected = { id: 'purchase1', estado: 'RECEIVED' } as any;

      service.receiveLate.mockResolvedValue(expected);

      const result = await controller.receive(mockUser, 'purchase1', dto);

      expect(service.receiveLate).toHaveBeenCalledWith('t1', 'u1', 'purchase1', dto);
      expect(result).toEqual(expected);
    });

    it('returns received purchase', async () => {
      const dto = {} as any;
      const expected = { id: 'purchase1', estado: 'RECEIVED' } as any;

      service.receiveLate.mockResolvedValue(expected);

      const result = await controller.receive(mockUser, 'purchase1', dto);

      expect(result).toEqual(expected);
    });
  });
});

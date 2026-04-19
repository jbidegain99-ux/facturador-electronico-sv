import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { Response } from 'express';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './services/inventory.service';
import { InventoryExportService } from './services/inventory-export.service';
import { InventoryFilterDto } from './dto/inventory-filter.dto';
import { KardexFilterDto } from './dto/kardex-filter.dto';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    getKardex: jest.Mock;
    getAlerts: jest.Mock;
    getTopBelowReorder: jest.Mock;
  };
  let exporter: { exportStockList: jest.Mock };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getKardex: jest.fn(),
      getAlerts: jest.fn(),
      getTopBelowReorder: jest.fn(),
    };
    exporter = { exportStockList: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: InventoryService, useValue: service },
        { provide: InventoryExportService, useValue: exporter },
      ],
    })
      .overrideGuard(PlanFeatureGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(InventoryController);
  });

  const user = (tenantId: string | null = 't1'): CurrentUserData => ({
    id: 'u1',
    email: 'u1@t.com',
    tenantId,
    rol: 'OWNER',
  });

  const emptyFilters: InventoryFilterDto = {};

  it('findAll calls service with tenantId + filters', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0, totalPages: 1, page: 1, limit: 20 });
    const filters: InventoryFilterDto = { search: 'x' };
    await controller.findAll(user(), filters);
    expect(service.findAll).toHaveBeenCalledWith('t1', filters);
  });

  it('findAll throws ForbiddenException when no tenant', async () => {
    await expect(controller.findAll(user(null), emptyFilters)).rejects.toThrow(ForbiddenException);
  });

  it('findOne calls service with tenantId + id', async () => {
    service.findOne.mockResolvedValue({ catalogItemId: 'c1' });
    await controller.findOne(user(), 'c1');
    expect(service.findOne).toHaveBeenCalledWith('t1', 'c1');
  });

  it('getKardex calls service with date range + optional movementType', async () => {
    service.getKardex.mockResolvedValue([]);
    const kardexFilters: KardexFilterDto = {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      movementType: 'ENTRADA_COMPRA',
    };
    await controller.getKardex(user(), 'c1', kardexFilters);
    expect(service.getKardex).toHaveBeenCalledWith('t1', 'c1', '2026-01-01', '2026-01-31', 'ENTRADA_COMPRA');
  });

  it('getAlerts calls service with tenantId', async () => {
    service.getAlerts.mockResolvedValue({ belowReorderCount: 0, outOfStockCount: 0 });
    await controller.getAlerts(user());
    expect(service.getAlerts).toHaveBeenCalledWith('t1');
  });

  it('getTopBelowReorder defaults limit to 5', async () => {
    service.getTopBelowReorder.mockResolvedValue([]);
    await controller.getTopBelowReorder(user(), undefined);
    expect(service.getTopBelowReorder).toHaveBeenCalledWith('t1', 5);
  });

  it('getTopBelowReorder clamps limit to [1,50]', async () => {
    service.getTopBelowReorder.mockResolvedValue([]);
    await controller.getTopBelowReorder(user(), '999');
    expect(service.getTopBelowReorder).toHaveBeenCalledWith('t1', 50);
  });

  it('exportStockList calls exporter and writes XLSX headers', async () => {
    exporter.exportStockList.mockResolvedValue(Buffer.from('xlsx'));
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    await controller.exportStockList(user(), emptyFilters, res);
    expect(exporter.exportStockList).toHaveBeenCalledWith('t1', emptyFilters);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.send).toHaveBeenCalled();
  });
});

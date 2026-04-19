import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { InventoryAdjustmentsController } from './inventory-adjustments.controller';
import { InventoryAdjustmentService } from './services/inventory-adjustment.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { ListAdjustmentsDto } from './dto/list-adjustments.dto';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';

describe('InventoryAdjustmentsController', () => {
  let controller: InventoryAdjustmentsController;
  let service: { createAdjustment: jest.Mock; listAdjustments: jest.Mock };

  beforeEach(async () => {
    service = { createAdjustment: jest.fn(), listAdjustments: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [InventoryAdjustmentsController],
      providers: [{ provide: InventoryAdjustmentService, useValue: service }],
    })
      .overrideGuard(PlanFeatureGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(InventoryAdjustmentsController);
  });

  const user = (tenantId: string | null = 't1'): CurrentUserData => ({
    id: 'u1',
    email: 'u1@t.com',
    tenantId,
    rol: 'GERENTE',
  });

  it('POST calls service with tenantId + userId + dto', async () => {
    service.createAdjustment.mockResolvedValue({ id: 'm1' });
    const dto: CreateAdjustmentDto = {
      catalogItemId: 'c1',
      subtype: 'MERMA',
      quantity: 1,
      movementDate: '2026-04-19',
    };
    await controller.create(user(), dto);
    expect(service.createAdjustment).toHaveBeenCalledWith('t1', 'u1', dto);
  });

  it('POST throws ForbiddenException when no tenant', async () => {
    const dto: CreateAdjustmentDto = {
      catalogItemId: 'c1', subtype: 'MERMA', quantity: 1, movementDate: '2026-04-19',
    };
    await expect(controller.create(user(null), dto)).rejects.toThrow(ForbiddenException);
  });

  it('GET calls service with tenantId + filters', async () => {
    service.listAdjustments.mockResolvedValue({ data: [], total: 0, totalPages: 1, page: 1, limit: 20 });
    const filters: ListAdjustmentsDto = { catalogItemId: 'c1' };
    await controller.list(user(), filters);
    expect(service.listAdjustments).toHaveBeenCalledWith('t1', filters);
  });

  it('GET throws ForbiddenException when no tenant', async () => {
    const filters: ListAdjustmentsDto = {};
    await expect(controller.list(user(null), filters)).rejects.toThrow(ForbiddenException);
  });
});

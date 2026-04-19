import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PhysicalCountsController } from './physical-counts.controller';
import { PhysicalCountService } from './services/physical-count.service';
import { PlanFeatureGuard } from '../plans/guards/plan-feature.guard';

describe('PhysicalCountsController', () => {
  let controller: PhysicalCountsController;
  let service: {
    create: jest.Mock; findAll: jest.Mock; findOne: jest.Mock;
    updateDetail: jest.Mock; uploadCsv: jest.Mock; finalize: jest.Mock;
    cancel: jest.Mock; getCsvTemplate: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(),
      updateDetail: jest.fn(), uploadCsv: jest.fn(), finalize: jest.fn(),
      cancel: jest.fn(), getCsvTemplate: jest.fn(),
    };
    const module = await Test.createTestingModule({
      controllers: [PhysicalCountsController],
      providers: [{ provide: PhysicalCountService, useValue: service }],
    })
      .overrideGuard(PlanFeatureGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(PhysicalCountsController);
  });

  const user = (tenantId: string | null = 't1'): CurrentUserData => ({
    id: 'u1', email: 'u1@t.com', tenantId, rol: 'GERENTE',
  });

  it('POST creates count with tenant + user', async () => {
    service.create.mockResolvedValue({ id: 'pc1' });
    await controller.create(user(), { countDate: '2026-04-19', fiscalYear: 2026 });
    expect(service.create).toHaveBeenCalledWith('t1', 'u1', { countDate: '2026-04-19', fiscalYear: 2026 });
  });

  it('POST throws ForbiddenException when no tenant', async () => {
    await expect(
      controller.create(user(null), { countDate: '2026-04-19', fiscalYear: 2026 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('GET list forwards filters', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0, totalPages: 1, page: 1, limit: 20 });
    await controller.list(user(), { status: 'DRAFT' });
    expect(service.findAll).toHaveBeenCalledWith('t1', { status: 'DRAFT' });
  });

  it('GET one forwards id + filters', async () => {
    service.findOne.mockResolvedValue({ id: 'pc1' });
    await controller.findOne(user(), 'pc1', { search: 'abc' });
    expect(service.findOne).toHaveBeenCalledWith('t1', 'pc1', { search: 'abc' });
  });

  it('PATCH detail forwards countId + detailId + dto', async () => {
    service.updateDetail.mockResolvedValue({ id: 'd1' });
    await controller.updateDetail(user(), 'pc1', 'd1', { countedQty: 5 });
    expect(service.updateDetail).toHaveBeenCalledWith('t1', 'pc1', 'd1', { countedQty: 5 });
  });

  it('POST finalize forwards countId + userId', async () => {
    service.finalize.mockResolvedValue({ id: 'pc1', status: 'FINALIZED' });
    await controller.finalize(user(), 'pc1', { confirm: true });
    expect(service.finalize).toHaveBeenCalledWith('t1', 'u1', 'pc1');
  });

  it('POST cancel forwards reason', async () => {
    service.cancel.mockResolvedValue({ id: 'pc1', status: 'CANCELLED' });
    await controller.cancel(user(), 'pc1', { reason: 'oops' });
    expect(service.cancel).toHaveBeenCalledWith('t1', 'pc1', { reason: 'oops' });
  });
});

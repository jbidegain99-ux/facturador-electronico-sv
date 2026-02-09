"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recurring_invoice_scheduler_1 = require("./recurring-invoice.scheduler");
const mock_queue_1 = require("../../../test/helpers/mock-queue");
describe('RecurringInvoiceScheduler', () => {
    let scheduler;
    let mockRecurringService;
    let mockQueue;
    const originalEnv = process.env;
    beforeEach(() => {
        mockRecurringService = {
            getDueTemplates: jest.fn().mockResolvedValue([]),
        };
        mockQueue = (0, mock_queue_1.createMockQueue)();
        scheduler = new recurring_invoice_scheduler_1.RecurringInvoiceScheduler(mockRecurringService, mockQueue);
    });
    afterEach(() => {
        process.env = originalEnv;
    });
    it('should skip when REDIS_URL is not configured', async () => {
        delete process.env.REDIS_URL;
        await scheduler.handleDueTemplates();
        expect(mockRecurringService.getDueTemplates).not.toHaveBeenCalled();
        expect(mockQueue.add).not.toHaveBeenCalled();
    });
    it('should find due templates and enqueue them', async () => {
        process.env.REDIS_URL = 'redis://localhost:6379';
        const templates = [
            { id: 'tmpl-1', nombre: 'Template 1' },
            { id: 'tmpl-2', nombre: 'Template 2' },
        ];
        mockRecurringService.getDueTemplates.mockResolvedValue(templates);
        await scheduler.handleDueTemplates();
        expect(mockRecurringService.getDueTemplates).toHaveBeenCalled();
        expect(mockQueue.add).toHaveBeenCalledTimes(2);
        expect(mockQueue.add).toHaveBeenCalledWith('process-recurring', { templateId: 'tmpl-1' }, expect.objectContaining({
            attempts: 3,
            backoff: expect.objectContaining({ type: 'exponential' }),
        }));
        expect(mockQueue.add).toHaveBeenCalledWith('process-recurring', { templateId: 'tmpl-2' }, expect.objectContaining({
            attempts: 3,
        }));
    });
    it('should handle errors without crashing', async () => {
        process.env.REDIS_URL = 'redis://localhost:6379';
        mockRecurringService.getDueTemplates.mockRejectedValue(new Error('DB connection lost'));
        // Should not throw
        await expect(scheduler.handleDueTemplates()).resolves.toBeUndefined();
    });
    it('should not enqueue when no templates are due', async () => {
        process.env.REDIS_URL = 'redis://localhost:6379';
        mockRecurringService.getDueTemplates.mockResolvedValue([]);
        await scheduler.handleDueTemplates();
        expect(mockRecurringService.getDueTemplates).toHaveBeenCalled();
        expect(mockQueue.add).not.toHaveBeenCalled();
    });
});

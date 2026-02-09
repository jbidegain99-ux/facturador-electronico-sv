"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockQueue = createMockQueue;
function createMockQueue() {
    return {
        add: jest.fn().mockResolvedValue({ id: 'job-1' }),
        getJobs: jest.fn().mockResolvedValue([]),
        close: jest.fn().mockResolvedValue(undefined),
    };
}

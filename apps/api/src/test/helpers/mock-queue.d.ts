export interface MockQueue {
    add: jest.Mock;
    getJobs: jest.Mock;
    close: jest.Mock;
}
export declare function createMockQueue(): MockQueue;
//# sourceMappingURL=mock-queue.d.ts.map
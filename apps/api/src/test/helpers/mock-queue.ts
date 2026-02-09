export interface MockQueue {
  add: jest.Mock;
  getJobs: jest.Mock;
  close: jest.Mock;
}

export function createMockQueue(): MockQueue {
  return {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    getJobs: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

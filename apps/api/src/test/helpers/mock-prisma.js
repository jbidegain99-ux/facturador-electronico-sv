"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockPrismaService = createMockPrismaService;
function createMockPrismaService() {
    return {
        cliente: {
            findMany: jest.fn().mockResolvedValue([]),
            findFirst: jest.fn().mockResolvedValue(null),
            findUnique: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
        },
        dTE: {
            findMany: jest.fn().mockResolvedValue([]),
            findFirst: jest.fn().mockResolvedValue(null),
            findUnique: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            aggregate: jest.fn().mockResolvedValue({}),
            groupBy: jest.fn().mockResolvedValue([]),
        },
        dTELog: {
            create: jest.fn().mockResolvedValue({}),
        },
        recurringInvoiceTemplate: {
            findMany: jest.fn().mockResolvedValue([]),
            findFirst: jest.fn().mockResolvedValue(null),
            findUnique: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
        },
        recurringInvoiceHistory: {
            findMany: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({}),
        },
        tenant: {
            findUnique: jest.fn().mockResolvedValue(null),
        },
        user: {
            findUnique: jest.fn().mockResolvedValue(null),
        },
        $transaction: jest.fn().mockImplementation((operations) => Promise.all(operations)),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
    };
}

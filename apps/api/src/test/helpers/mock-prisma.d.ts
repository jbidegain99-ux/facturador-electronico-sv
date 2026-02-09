import { PrismaService } from '../../prisma/prisma.service';
export interface MockPrismaClient {
    cliente: {
        findMany: jest.Mock;
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        count: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
    };
    dTE: {
        findMany: jest.Mock;
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        count: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        aggregate: jest.Mock;
        groupBy: jest.Mock;
    };
    dTELog: {
        create: jest.Mock;
    };
    recurringInvoiceTemplate: {
        findMany: jest.Mock;
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        count: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
    };
    recurringInvoiceHistory: {
        findMany: jest.Mock;
        count: jest.Mock;
        create: jest.Mock;
    };
    tenant: {
        findUnique: jest.Mock;
    };
    user: {
        findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
    $connect: jest.Mock;
    $disconnect: jest.Mock;
}
export declare function createMockPrismaService(): MockPrismaClient;
/**
 * Type-safe way to provide mock PrismaService to NestJS testing module.
 * Usage: { provide: PrismaService, useValue: createMockPrismaService() }
 */
export type MockPrismaProvider = {
    provide: typeof PrismaService;
    useValue: MockPrismaClient;
};
//# sourceMappingURL=mock-prisma.d.ts.map
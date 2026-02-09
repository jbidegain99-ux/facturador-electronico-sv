import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService, MockPrismaClient } from '../../test/helpers/mock-prisma';
import { createMockCliente } from '../../test/helpers/test-fixtures';

describe('ClientesService', () => {
  let service: ClientesService;
  let prisma: MockPrismaClient;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
  });

  describe('findAll', () => {
    it('should return paginated results with defaults', async () => {
      const clientes = [createMockCliente(), createMockCliente({ id: 'cliente-2' })];
      prisma.cliente.findMany.mockResolvedValue(clientes);
      prisma.cliente.count.mockResolvedValue(2);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual({
        data: clientes,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-1' },
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should apply search filter across nombre, numDocumento, correo', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);
      prisma.cliente.count.mockResolvedValue(0);

      await service.findAll('tenant-1', { search: 'test' });

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant-1',
            OR: [
              { nombre: { contains: 'test' } },
              { numDocumento: { contains: 'test' } },
              { correo: { contains: 'test' } },
            ],
          },
        }),
      );
    });

    it('should use allowed sortBy field', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);
      prisma.cliente.count.mockResolvedValue(0);

      await service.findAll('tenant-1', { sortBy: 'nombre', sortOrder: 'asc' });

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nombre: 'asc' },
        }),
      );
    });

    it('should fallback to createdAt when sortBy is invalid', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);
      prisma.cliente.count.mockResolvedValue(0);

      await service.findAll('tenant-1', { sortBy: 'invalid_field' });

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);
      prisma.cliente.count.mockResolvedValue(45);

      const result = await service.findAll('tenant-1', { limit: 20 });

      expect(result.totalPages).toBe(3); // Math.ceil(45/20) = 3
    });

    it('should calculate skip correctly for page > 1', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);
      prisma.cliente.count.mockResolvedValue(0);

      await service.findAll('tenant-1', { page: 3, limit: 10 });

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
        }),
      );
    });

    it('should use sortOrder desc by default', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);
      prisma.cliente.count.mockResolvedValue(0);

      await service.findAll('tenant-1', {});

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a cliente when numDocumento is unique', async () => {
      const newCliente = createMockCliente();
      prisma.cliente.findUnique.mockResolvedValue(null);
      prisma.cliente.create.mockResolvedValue(newCliente);

      const dto = {
        tipoDocumento: '36',
        numDocumento: '06141234567890',
        nombre: 'Cliente Test',
        direccion: { departamento: '06', municipio: '14', complemento: 'Calle 1' },
      };

      const result = await service.create('tenant-1', dto as Parameters<typeof service.create>[1]);
      expect(result).toEqual(newCliente);
      expect(prisma.cliente.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            nombre: 'Cliente Test',
          }),
        }),
      );
    });

    it('should throw ConflictException when numDocumento already exists', async () => {
      prisma.cliente.findUnique.mockResolvedValue(createMockCliente());

      const dto = {
        tipoDocumento: '36',
        numDocumento: '06141234567890',
        nombre: 'Duplicate',
        direccion: { departamento: '06', municipio: '14', complemento: 'Calle 1' },
      };

      await expect(
        service.create('tenant-1', dto as Parameters<typeof service.create>[1]),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return cliente when found', async () => {
      const cliente = createMockCliente();
      prisma.cliente.findFirst.mockResolvedValue(cliente);

      const result = await service.findOne('tenant-1', 'cliente-1');
      expect(result).toEqual(cliente);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.cliente.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('tenant-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a cliente with no associated DTEs', async () => {
      prisma.cliente.findFirst.mockResolvedValue(createMockCliente());
      prisma.dTE.count.mockResolvedValue(0);
      prisma.cliente.delete.mockResolvedValue({});

      const result = await service.remove('tenant-1', 'cliente-1');
      expect(result).toEqual({ message: 'Cliente eliminado exitosamente' });
      expect(prisma.cliente.delete).toHaveBeenCalledWith({ where: { id: 'cliente-1' } });
    });

    it('should throw ConflictException when cliente has associated DTEs', async () => {
      prisma.cliente.findFirst.mockResolvedValue(createMockCliente());
      prisma.dTE.count.mockResolvedValue(3);

      await expect(
        service.remove('tenant-1', 'cliente-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});

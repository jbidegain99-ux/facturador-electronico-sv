import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SignerController } from './signer.controller';
import { SignerService } from './signer.service';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import { createMockUser, createMockAuthGuard } from '../../test/helpers/mock-user';

describe('SignerController', () => {
  let controller: SignerController;
  let mockSignerService: Record<string, jest.Mock>;

  const superAdmin = createMockUser({ rol: 'SUPER_ADMIN' });
  const regularUser = createMockUser({ rol: 'ADMIN' });

  beforeEach(async () => {
    mockSignerService = {
      isCertificateLoaded: jest.fn(),
      isCertificateValid: jest.fn(),
      getCertificateInfo: jest.fn(),
      loadCertificateFromBuffer: jest.fn(),
      signDTEWithInfo: jest.fn(),
      verifySignature: jest.fn(),
      decodeJWSHeader: jest.fn(),
      decodeJWSPayload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignerController],
      providers: [
        { provide: SignerService, useValue: mockSignerService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(createMockAuthGuard(superAdmin))
      .overrideGuard(SuperAdminGuard)
      .useValue({
        canActivate: (context: { switchToHttp: () => { getRequest: () => { user: { rol: string } } } }) => {
          const user = context.switchToHttp().getRequest().user;
          if (user.rol !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Se requiere rol de Super Administrador');
          }
          return true;
        },
      })
      .compile();

    controller = module.get<SignerController>(SignerController);
  });

  describe('getStatus', () => {
    it('should return loaded=false when no certificate', () => {
      mockSignerService.isCertificateLoaded.mockReturnValue(false);

      const result = controller.getStatus();

      expect(result).toEqual({
        loaded: false,
        valid: false,
        certificate: null,
      });
    });

    it('should return certificate info when loaded', () => {
      mockSignerService.isCertificateLoaded.mockReturnValue(true);
      mockSignerService.isCertificateValid.mockReturnValue(true);
      mockSignerService.getCertificateInfo.mockReturnValue({
        subject: 'Test Subject',
        issuer: 'Test Issuer',
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2027-01-01'),
        serialNumber: 'ABC123',
      });

      const result = controller.getStatus();

      expect(result).toEqual({
        loaded: true,
        valid: true,
        certificate: expect.objectContaining({
          subject: 'Test Subject',
          serialNumber: 'ABC123',
        }),
      });
    });
  });

  describe('loadCertificate', () => {
    it('should load certificate for super admin', async () => {
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      mockSignerService.loadCertificateFromBuffer.mockResolvedValue({
        subject: 'Test',
        issuer: 'Issuer',
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2027-01-01'),
        serialNumber: 'SN001',
      });

      const result = await controller.loadCertificate(mockFile, { password: 'pass' });

      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(mockSignerService.loadCertificateFromBuffer).toHaveBeenCalledWith(
        mockFile.buffer,
        'pass',
      );
    });
  });

  describe('SuperAdminGuard protection', () => {
    it('should have SuperAdminGuard decorator applied', () => {
      // Verify the controller class has the guard metadata
      const guards = Reflect.getMetadata('__guards__', SignerController);
      expect(guards).toBeDefined();
      expect(guards).toContain(SuperAdminGuard);
    });
  });
});

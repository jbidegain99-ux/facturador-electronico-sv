import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

interface UploadResult {
  url: string;
  blobName: string;
}

@Injectable()
export class BlobStorageService {
  private readonly logger = new Logger(BlobStorageService.name);
  private containerClient: ContainerClient | null = null;
  private readonly containerName = 'tenant-logos';

  constructor(private configService: ConfigService) {
    this.initClient();
  }

  private initClient(): void {
    const connectionString = this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
    if (!connectionString) {
      this.logger.warn('AZURE_STORAGE_CONNECTION_STRING not configured — logo upload disabled');
      return;
    }

    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      this.containerClient = blobServiceClient.getContainerClient(this.containerName);
      this.logger.log(`Blob storage initialized, container: ${this.containerName}`);
    } catch (error) {
      this.logger.error(`Failed to initialize blob storage: ${error}`);
    }
  }

  isConfigured(): boolean {
    return this.containerClient !== null;
  }

  async ensureContainer(): Promise<void> {
    if (!this.containerClient) return;
    await this.containerClient.createIfNotExists({ access: 'blob' });
  }

  async uploadLogo(tenantId: string, file: Buffer, mimeType: string): Promise<UploadResult> {
    if (!this.containerClient) {
      throw new Error('Blob storage not configured');
    }

    await this.ensureContainer();

    const extension = mimeType === 'image/png' ? 'png'
      : mimeType === 'image/jpeg' ? 'jpg'
      : mimeType === 'image/webp' ? 'webp'
      : mimeType === 'image/svg+xml' ? 'svg'
      : 'png';

    const blobName = `${tenantId}/logo-${Date.now()}.${extension}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(file, file.length, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
        blobCacheControl: 'public, max-age=31536000',
      },
    });

    this.logger.log(`Logo uploaded: ${blobName}`);
    return { url: blockBlobClient.url, blobName };
  }

  async deleteLogo(blobUrl: string): Promise<void> {
    if (!this.containerClient) return;

    try {
      // Extract blob name from URL
      const url = new URL(blobUrl);
      const pathParts = url.pathname.split(`/${this.containerName}/`);
      if (pathParts.length < 2) return;

      const blobName = pathParts[1];
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
      this.logger.log(`Logo deleted: ${blobName}`);
    } catch (error) {
      this.logger.error(`Failed to delete logo: ${error}`);
    }
  }
}

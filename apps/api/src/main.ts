import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Habilitar CORS - support both CORS_ORIGIN (singular) and CORS_ORIGINS (plural)
  const corsEnv = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;
  const allowedOrigins = corsEnv
    ? corsEnv.split(',').map((o) => o.trim())
    : [
        'https://facturador-web-sv-chayeth5a0h2abcf.eastus2-01.azurewebsites.net',
        'http://localhost:3000',
      ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', ''],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Only expose Swagger in non-production environments
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Facturador Electronico SV API')
      .setDescription('API para facturacion electronica en El Salvador')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

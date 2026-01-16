import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Facturador Electronico SV API')
    .setDescription('API para facturacion electronica de El Salvador - Ministerio de Hacienda')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticacion de usuarios y MH')
    .addTag('tenants', 'Gestion de empresas/tenants')
    .addTag('dte', 'Documentos Tributarios Electronicos')
    .addTag('catalog', 'Catalogos del MH')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs on http://localhost:${port}/api/docs`);
}

bootstrap();

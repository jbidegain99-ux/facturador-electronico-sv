"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Habilitar CORS - permitir orígenes desde variable de entorno o defaults
    const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
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
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Facturador Electronico SV API')
        .setDescription('API para facturacion electronica en El Salvador')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    await app.listen(process.env.PORT || 3000);
}
bootstrap();

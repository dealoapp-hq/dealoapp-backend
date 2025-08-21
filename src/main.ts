import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cors from 'cors';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      credentials: true,
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Dealo API')
    .setDescription(
      "Dealo - Africa's trusted social economy for learning and earning. This API provides comprehensive endpoints for user management, course creation, job marketplace, payments, and AI-powered services.",
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management, profiles, and account operations')
    .addTag('Courses', 'Course creation, management, and learning operations')
    .addTag('Jobs', 'Freelance job marketplace and proposal management')
    .addTag('Payments', 'Payment processing, transactions, and escrow services')
    .addTag(
      'AI Services',
      'AI-powered learning, recommendations, and content generation',
    )
    .addTag('Certifications', 'Certificate management and verification')
    .addTag('Achievements', 'User achievements and gamification')
    .addTag('Networking', 'Professional networking and connections')
    .addTag('Chat', 'Real-time messaging and communication')
    .addTag('Notifications', 'User notifications and alerts')
    .addTag('Analytics', 'Data analytics and insights')
    .addTag('Media', 'File upload and media management')
    .addTag('Verification', 'User and content verification services')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.dealo.africa', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Dealo API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Dealo API:', error);
  process.exit(1);
});

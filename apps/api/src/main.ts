import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Validation is handled via Zod schemas from @impactforge/shared

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global middleware
  app.use(new CorrelationIdMiddleware().use);

  // Global route prefix to match frontend expectations
  // Exclude health endpoints so Azure probes work at /health
  app.setGlobalPrefix('v1', { exclude: ['health', 'health/db'] });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`Gateway2Work API running on port ${port}`);
}

bootstrap();

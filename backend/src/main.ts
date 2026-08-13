import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  if (process.env.AUTH_DEV_BYPASS === 'true') {
    console.warn('AUTH_DEV_BYPASS=true — do not use this in a real deploy');
  }

  const config = new DocumentBuilder()
    .setTitle('Elovate API')
    .setDescription(
      [
        'Connects to Postgres from the repo-root `.env` (`FLYWAY_*` or `DATABASE_URL`). Schema is `/migrations` (Flyway).',
        '',
        'Additive RBAC: signup grants **learner**; extra roles union permission codes from V2.',
        'Roles: platform_admin, platform_catalog_admin, org_admin, educator, learner.',
        '',
        'Lifecycle: activate/deactivate (users, courses, questions), suspend/activate (orgs), withdraw/activate (enrollments). No hard-delete on those — keep history.',
        'Roles: grant extra roles with POST /rbac/assignments; unassign extras with POST /rbac/assignments/remove. Never remove learner or delete seeded roles.',
        '',
        'Each operation lists the permission code and who grants it. Route bodies are still TODO until services are written.',
        'List endpoints take query filters (organizationId, role, status, search, etc.).',
      ].join('\n'),
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`API http://localhost:${port}/api`);
  console.log(`Docs http://localhost:${port}/docs`);
}

bootstrap();

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsController } from './controllers/analytics.controller';
import { AuthController } from './controllers/auth.controller';
import { CoursesController } from './controllers/courses.controller';
import { EnrollmentsController } from './controllers/enrollments.controller';
import { HealthController } from './controllers/health.controller';
import { InterventionsController } from './controllers/interventions.controller';
import { LookupsController } from './controllers/lookups.controller';
import { OrganizationsController } from './controllers/organizations.controller';
import { QuestionsController } from './controllers/questions.controller';
import { QuizzesController } from './controllers/quizzes.controller';
import { RbacController } from './controllers/rbac.controller';
import { UsersController } from './controllers/users.controller';
import { envFilePaths } from './helpers/env';
import { AuthGuard } from './guards/auth.guard';
import { CoursesContentRepository } from './repositories/courses-content.repository';
import { CoursesRepository } from './repositories/courses.repository';
import { OrganizationsRepository } from './repositories/organizations.repository';
import { RbacCatalogueRepository } from './repositories/rbac-catalogue.repository';
import { RbacRepository } from './repositories/rbac.repository';
import { UsersRepository } from './repositories/users.repository';
import { AuthContextService } from './services/auth-context.service';
import { CoursesService } from './services/courses.service';
import { OrganizationsService } from './services/organizations.service';
import { PostgresService } from './services/postgres.service';
import { RbacService } from './services/rbac.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: envFilePaths })],
  providers: [
    PostgresService,
    UsersRepository,
    RbacRepository,
    RbacCatalogueRepository,
    OrganizationsRepository,
    CoursesRepository,
    CoursesContentRepository,
    AuthContextService,
    AuthGuard,
    UsersService,
    RbacService,
    OrganizationsService,
    CoursesService,
  ],
  controllers: [
    HealthController,
    AuthController,
    OrganizationsController,
    UsersController,
    RbacController,
    CoursesController,
    QuestionsController,
    EnrollmentsController,
    QuizzesController,
    AnalyticsController,
    LookupsController,
    InterventionsController,
  ],
})
export class AppModule {}

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
import { AuthContextService } from './services/auth-context.service';
import { PostgresService } from './services/postgres.service';
import { RbacService } from './services/rbac.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: envFilePaths })],
  providers: [
    PostgresService,
    AuthContextService,
    AuthGuard,
    UsersService,
    RbacService,
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

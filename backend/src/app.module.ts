import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envFilePaths } from './helpers/env';
import { HealthController } from './health.controller';
import { AuthController } from './auth.controller';
import { OrganizationsController } from './organizations.controller';
import { UsersController } from './users.controller';
import { RbacController } from './rbac.controller';
import { CoursesController } from './courses.controller';
import { QuestionsController } from './questions.controller';
import { EnrollmentsController } from './enrollments.controller';
import { QuizzesController } from './quizzes.controller';
import { AnalyticsController } from './analytics.controller';
import { LookupsController } from './lookups.controller';
import { InterventionsController } from './interventions.controller';
import { PostgresService } from './postgres.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: envFilePaths })],
  providers: [PostgresService],
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

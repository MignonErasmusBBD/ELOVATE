import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { AuthUser, CurrentUser } from '../helpers/auth-user';
import { LookupsService } from '../services/lookups.service';

@ApiTags('Lookups')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('lookups')
export class LookupsController {
  constructor(private readonly lookups: LookupsService) {}

  @Get()
  @ApiOperation({
    summary: 'All lookup tables (V1 seeds)',
    description:
      'Select oauth_providers, course_visibilities, question_formats, enrollment_statuses, quiz_attempt_statuses, bloom_levels, difficulty_levels, intervention_trigger_types, intervention_flag_statuses, roles, plus status lookups from later migrations.\nPermission: user.read.self (all roles).',
  })
  all(@CurrentUser() actor: AuthUser) {
    return this.lookups.all(actor);
  }

  @Get('bloom-levels')
  @ApiOperation({
    summary: 'Bloom levels',
    description: 'Select bloom_levels.\nPermission: user.read.self (all roles).',
  })
  bloom(@CurrentUser() actor: AuthUser) {
    return this.lookups.bloomLevels(actor);
  }

  @Get('difficulty-levels')
  @ApiOperation({
    summary: 'Difficulty levels',
    description: 'Select difficulty_levels.\nPermission: user.read.self (all roles).',
  })
  difficulty(@CurrentUser() actor: AuthUser) {
    return this.lookups.difficultyLevels(actor);
  }

  @Get('question-formats')
  @ApiOperation({
    summary: 'Question formats',
    description: 'Select question_formats.\nPermission: user.read.self (all roles).',
  })
  formats(@CurrentUser() actor: AuthUser) {
    return this.lookups.questionFormats(actor);
  }

  @Get('course-visibilities')
  @ApiOperation({
    summary: 'Course visibilities',
    description: 'Select course_visibilities.\nPermission: user.read.self (all roles).',
  })
  visibilities(@CurrentUser() actor: AuthUser) {
    return this.lookups.courseVisibilities(actor);
  }
}

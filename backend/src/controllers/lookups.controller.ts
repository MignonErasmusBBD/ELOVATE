import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';

@ApiTags('Lookups')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('lookups')
export class LookupsController {
  @Get()
  @ApiOperation({
    summary: 'All lookup tables (V1 seeds)',
    description:
      'TODO: select oauth_providers, course_visibilities, question_formats, enrollment_statuses, quiz_attempt_statuses, bloom_levels, difficulty_levels, intervention_trigger_types, intervention_flag_statuses, roles.\nPermission: user.read.self (all roles).',
  })
  all() {
    return { message: 'TODO: read V1 lookup tables' };
  }

  @Get('bloom-levels')
  @ApiOperation({
    summary: 'Bloom levels',
    description: 'TODO: bloom_levels.\nPermission: user.read.self (all roles).',
  })
  bloom() {
    return {
      items: [
        { bloomLevelId: 1, name: 'Remember', rank: 1 },
        { bloomLevelId: 2, name: 'Understand', rank: 2 },
        { bloomLevelId: 3, name: 'Apply', rank: 3 },
        { bloomLevelId: 4, name: 'Analyze', rank: 4 },
        { bloomLevelId: 5, name: 'Evaluate', rank: 5 },
        { bloomLevelId: 6, name: 'Create', rank: 6 },
      ],
    };
  }

  @Get('difficulty-levels')
  @ApiOperation({
    summary: 'Difficulty levels',
    description: 'TODO: difficulty_levels.\nPermission: user.read.self (all roles).',
  })
  difficulty() {
    return {
      items: [
        { difficultyLevelId: 1, name: 'Easy', rank: 1 },
        { difficultyLevelId: 2, name: 'Medium', rank: 2 },
        { difficultyLevelId: 3, name: 'Hard', rank: 3 },
        { difficultyLevelId: 4, name: 'Expert', rank: 4 },
      ],
    };
  }

  @Get('question-formats')
  @ApiOperation({
    summary: 'Question formats',
    description: 'TODO: question_formats.\nPermission: user.read.self (all roles).',
  })
  formats() {
    return {
      items: [
        { questionFormatId: 1, formatCode: 'mcq' },
        { questionFormatId: 2, formatCode: 'true_false' },
        { questionFormatId: 3, formatCode: 'short_answer' },
      ],
    };
  }

  @Get('course-visibilities')
  @ApiOperation({
    summary: 'Course visibilities',
    description: 'TODO: course_visibilities.\nPermission: user.read.self (all roles).',
  })
  visibilities() {
    return {
      items: [
        { courseVisibilityId: 1, visibilityCode: 'private' },
        { courseVisibilityId: 2, visibilityCode: 'community' },
      ],
    };
  }
}

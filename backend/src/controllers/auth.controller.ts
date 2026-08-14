import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

class SyncProfileDto {
  @ApiProperty({ example: 1, description: 'oauth_providers.oauth_provider_id (1=google, 2=microsoft)' })
  @IsNumber()
  oauthProviderId: number;

  @ApiProperty({ description: 'users.oauth_id — subject from the provider' })
  @IsString()
  oauthId: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Post('sync-profile')
  @ApiOperation({
    summary: 'Upsert users after OAuth/Neon login',
    description: [
      'TODO: insert organizations (personal org if needed) + users + user_roles (learner).',
      'DB: users.organization_id is NOT NULL (one org per user). UNIQUE (oauth_provider_id, oauth_id).',
      'Permission after sync: user.create.self (all roles). No JWT yet on first create.',
    ].join('\n'),
  })
  syncProfile(@Body() _dto: SyncProfileDto) {
    return { message: 'TODO: upsert users + learner role' };
  }
}

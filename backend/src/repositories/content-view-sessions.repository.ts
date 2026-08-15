import { Injectable } from '@nestjs/common';
import { PostgresService } from '../services/postgres.service';

@Injectable()
export class ContentViewSessionsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async record(input: {
    userId: string;
    courseId: string;
    courseSectionId: string;
    durationSeconds: number;
  }): Promise<void> {
    await this.postgres.query(
      `INSERT INTO content_view_sessions (user_id, course_id, course_section_id, duration_seconds)
       VALUES ($1, $2, $3, $4)`,
      [input.userId, input.courseId, input.courseSectionId, input.durationSeconds],
    );
  }
}

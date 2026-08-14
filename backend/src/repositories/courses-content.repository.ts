import { Injectable } from '@nestjs/common';
import { isUuid } from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

type SectionRow = {
  id: string;
  course_id: string;
  title: string;
  position: number;
};

type TopicRow = {
  id: string;
  course_id: string;
  name: string;
};

export type PublicSection = {
  id: string;
  courseId: string;
  title: string;
  position: number;
};

export type PublicTopic = {
  id: string;
  courseId: string;
  name: string;
};

function toPublicSection(row: SectionRow): PublicSection {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    position: row.position,
  };
}

function toPublicTopic(row: TopicRow): PublicTopic {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
  };
}

@Injectable()
export class CoursesContentRepository {
  constructor(private readonly postgres: PostgresService) {}

  async listSections(courseId: string): Promise<PublicSection[]> {
    const result = await this.postgres.query<SectionRow>(
      `SELECT id, course_id, title, position
       FROM course_sections
       WHERE course_id = $1
       ORDER BY position, title`,
      [courseId],
    );
    return result.rows.map(toPublicSection);
  }

  async findSection(
    courseId: string,
    sectionId: string,
  ): Promise<PublicSection | undefined> {
    if (isUuid(sectionId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<SectionRow>(
      `SELECT id, course_id, title, position
       FROM course_sections
       WHERE id = $1 AND course_id = $2`,
      [sectionId, courseId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicSection(row);
  }

  async findSectionById(sectionId: string): Promise<PublicSection | undefined> {
    if (isUuid(sectionId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<SectionRow>(
      `SELECT id, course_id, title, position
       FROM course_sections
       WHERE id = $1`,
      [sectionId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicSection(row);
  }

  async insertSection(
    courseId: string,
    title: string,
    position: number,
  ): Promise<PublicSection> {
    const inserted = await this.postgres.query<SectionRow>(
      `INSERT INTO course_sections (course_id, title, position)
       VALUES ($1, $2, $3)
       RETURNING id, course_id, title, position`,
      [courseId, title, position],
    );
    const row = inserted.rows[0];
    if (row === undefined) {
      throw new Error('Section insert returned no row');
    }
    return toPublicSection(row);
  }

  async updateSection(
    courseId: string,
    sectionId: string,
    title: string,
    position: number,
  ) {
    await this.postgres.query(
      `UPDATE course_sections
       SET title = $3, position = $4
       WHERE id = $1 AND course_id = $2`,
      [sectionId, courseId, title, position],
    );
  }

  async sectionHasQuestions(sectionId: string): Promise<boolean> {
    const result = await this.postgres.query<{ id: string }>(
      'SELECT id FROM questions WHERE course_section_id = $1 LIMIT 1',
      [sectionId],
    );
    return result.rows[0] !== undefined;
  }

  async deleteSection(courseId: string, sectionId: string) {
    await this.postgres.query(
      'DELETE FROM course_sections WHERE id = $1 AND course_id = $2',
      [sectionId, courseId],
    );
  }

  async listTopics(courseId: string): Promise<PublicTopic[]> {
    const result = await this.postgres.query<TopicRow>(
      `SELECT id, course_id, name
       FROM topics
       WHERE course_id = $1
       ORDER BY name`,
      [courseId],
    );
    return result.rows.map(toPublicTopic);
  }

  async findTopic(
    courseId: string,
    topicId: string,
  ): Promise<PublicTopic | undefined> {
    if (isUuid(topicId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<TopicRow>(
      `SELECT id, course_id, name
       FROM topics
       WHERE id = $1 AND course_id = $2`,
      [topicId, courseId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicTopic(row);
  }

  async insertTopic(courseId: string, name: string): Promise<PublicTopic> {
    const inserted = await this.postgres.query<TopicRow>(
      `INSERT INTO topics (course_id, name)
       VALUES ($1, $2)
       RETURNING id, course_id, name`,
      [courseId, name],
    );
    const row = inserted.rows[0];
    if (row === undefined) {
      throw new Error('Topic insert returned no row');
    }
    return toPublicTopic(row);
  }

  async updateTopic(
    courseId: string,
    topicId: string,
    name: string,
  ): Promise<PublicTopic | undefined> {
    if (isUuid(topicId) === false) {
      return undefined;
    }
    const updated = await this.postgres.query<TopicRow>(
      `UPDATE topics
       SET name = $3
       WHERE id = $1 AND course_id = $2
       RETURNING id, course_id, name`,
      [topicId, courseId, name],
    );
    const row = updated.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicTopic(row);
  }

  async deleteTopic(courseId: string, topicId: string): Promise<boolean> {
    if (isUuid(topicId) === false) {
      return false;
    }
    return this.postgres.withTransaction(async (query) => {
      await query('DELETE FROM question_topics WHERE topic_id = $1', [topicId]);
      const deleted = await query<{ id: string }>(
        'DELETE FROM topics WHERE id = $1 AND course_id = $2 RETURNING id',
        [topicId, courseId],
      );
      return deleted.rows[0] !== undefined;
    });
  }
}

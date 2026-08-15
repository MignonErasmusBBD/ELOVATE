import { Injectable } from '@nestjs/common';
import { isUuid, SqlQuery } from '../helpers/values';
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

type ContentBlockRow = {
  id: string;
  course_section_id: string;
  body_text: string;
  content_type: string;
  position: number;
};

export type PublicContentBlock = {
  id: string;
  contentType: 'text' | 'code';
  bodyText: string;
  position: number;
};

export type PublicSection = {
  id: string;
  courseId: string;
  title: string;
  position: number;
  contentBlocks: PublicContentBlock[];
};

export type PublicTopic = {
  id: string;
  courseId: string;
  name: string;
};

export type ContentBlockInput = {
  contentType: 'text' | 'code';
  bodyText: string;
  position: number;
};

function toPublicContentBlock(row: ContentBlockRow): PublicContentBlock | undefined {
  if (row.content_type !== 'text' && row.content_type !== 'code') {
    return undefined;
  }
  return {
    id: row.id,
    contentType: row.content_type,
    bodyText: row.body_text,
    position: row.position,
  };
}

function toPublicSection(
  row: SectionRow,
  contentBlocks: PublicContentBlock[],
): PublicSection {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    position: row.position,
    contentBlocks,
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
    const sections = result.rows;
    if (sections.length === 0) {
      return [];
    }
    const contentBySectionId = await this.listContentBlocksForCourse(courseId);
    return sections.map((row) => {
      const blocks = contentBySectionId.get(row.id);
      return toPublicSection(row, blocks === undefined ? [] : blocks);
    });
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
    const contentBlocks = await this.listContentBlocksForSection(sectionId);
    return toPublicSection(row, contentBlocks);
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
    const contentBlocks = await this.listContentBlocksForSection(sectionId);
    return toPublicSection(row, contentBlocks);
  }

  async insertSection(
    courseId: string,
    title: string,
    position: number,
    contentBlocks: ContentBlockInput[],
  ): Promise<PublicSection> {
    return this.postgres.withTransaction(async (query) => {
      const inserted = await query<SectionRow>(
        `INSERT INTO course_sections (course_id, title, position)
         VALUES ($1, $2, $3)
         RETURNING id, course_id, title, position`,
        [courseId, title, position],
      );
      const row = inserted.rows[0];
      if (row === undefined) {
        throw new Error('Section insert returned no row');
      }
      await this.insertContentBlocks(query, row.id, contentBlocks);
      const blocks = await this.listContentBlocksForSectionWithQuery(query, row.id);
      return toPublicSection(row, blocks);
    });
  }

  async replaceSection(
    courseId: string,
    sectionId: string,
    title: string,
    position: number,
    contentBlocks: ContentBlockInput[],
  ): Promise<PublicSection | undefined> {
    if (isUuid(sectionId) === false) {
      return undefined;
    }
    return this.postgres.withTransaction(async (query) => {
      const updated = await query<SectionRow>(
        `UPDATE course_sections
         SET title = $3, position = $4
         WHERE id = $1 AND course_id = $2
         RETURNING id, course_id, title, position`,
        [sectionId, courseId, title, position],
      );
      const row = updated.rows[0];
      if (row === undefined) {
        return undefined;
      }
      await query('DELETE FROM course_section_content WHERE course_section_id = $1', [
        sectionId,
      ]);
      await this.insertContentBlocks(query, sectionId, contentBlocks);
      const blocks = await this.listContentBlocksForSectionWithQuery(query, sectionId);
      return toPublicSection(row, blocks);
    });
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

  private async listContentBlocksForSection(
    sectionId: string,
  ): Promise<PublicContentBlock[]> {
    const result = await this.postgres.query<ContentBlockRow>(
      `SELECT
         c.id,
         c.course_section_id,
         c.body_text,
         ct.content_type_code AS content_type,
         c.position
       FROM course_section_content c
       JOIN content_types ct ON ct.content_type_id = c.content_type_id
       WHERE c.course_section_id = $1
       ORDER BY c.position, c.id`,
      [sectionId],
    );
    const blocks: PublicContentBlock[] = [];
    for (const row of result.rows) {
      const block = toPublicContentBlock(row);
      if (block !== undefined) {
        blocks.push(block);
      }
    }
    return blocks;
  }

  private async listContentBlocksForSectionWithQuery(
    query: SqlQuery,
    sectionId: string,
  ): Promise<PublicContentBlock[]> {
    const result = await query<ContentBlockRow>(
      `SELECT
         c.id,
         c.course_section_id,
         c.body_text,
         ct.content_type_code AS content_type,
         c.position
       FROM course_section_content c
       JOIN content_types ct ON ct.content_type_id = c.content_type_id
       WHERE c.course_section_id = $1
       ORDER BY c.position, c.id`,
      [sectionId],
    );
    const blocks: PublicContentBlock[] = [];
    for (const row of result.rows) {
      const block = toPublicContentBlock(row);
      if (block !== undefined) {
        blocks.push(block);
      }
    }
    return blocks;
  }

  private async listContentBlocksForCourse(
    courseId: string,
  ): Promise<Map<string, PublicContentBlock[]>> {
    const result = await this.postgres.query<ContentBlockRow>(
      `SELECT
         c.id,
         c.course_section_id,
         c.body_text,
         ct.content_type_code AS content_type,
         c.position
       FROM course_section_content c
       JOIN content_types ct ON ct.content_type_id = c.content_type_id
       JOIN course_sections s ON s.id = c.course_section_id
       WHERE s.course_id = $1
       ORDER BY c.position, c.id`,
      [courseId],
    );
    const contentBySectionId = new Map<string, PublicContentBlock[]>();
    for (const row of result.rows) {
      const block = toPublicContentBlock(row);
      if (block === undefined) {
        continue;
      }
      const existing = contentBySectionId.get(row.course_section_id);
      if (existing === undefined) {
        contentBySectionId.set(row.course_section_id, [block]);
      } else {
        existing.push(block);
      }
    }
    return contentBySectionId;
  }

  private async insertContentBlocks(
    query: SqlQuery,
    sectionId: string,
    contentBlocks: ContentBlockInput[],
  ) {
    for (const block of contentBlocks) {
      await query(
        `INSERT INTO course_section_content (
           course_section_id, body_text, content_type_id, position
         )
         SELECT $1, $2, ct.content_type_id, $3
         FROM content_types ct
         WHERE ct.content_type_code = $4`,
        [sectionId, block.bodyText, block.position, block.contentType],
      );
    }
  }
}

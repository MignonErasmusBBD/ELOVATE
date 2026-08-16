import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import {
  GeneratedQuestion,
  PublicAttempt,
  QuizzesRepository,
} from '../repositories/quizzes.repository';
import { PublicQuestion, QuestionsRepository } from '../repositories/questions.repository';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly quizzes: QuizzesRepository,
    private readonly enrollments: EnrollmentsRepository,
    private readonly questions: QuestionsRepository,
    private readonly courses: CoursesRepository,
  ) {}

  async generate(actor: AuthUser, courseId: string) {
    requirePermission(actor, ['quiz.attempt']);
    const course = await this.courses.findById(courseId);
    if (course === undefined || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }
    const enrolled = await this.enrollments.hasActiveEnrollment(actor.id, courseId);
    if (enrolled === false) {
      throw new ForbiddenException('An active enrollment is required to generate a quiz');
    }
    const allQuestions = await this.questions.listActiveForCourse(courseId);
    if (allQuestions.length === 0) {
      throw new ConflictException('No active questions in this course');
    }

    const [mastery, seenIds] = await Promise.all([
      this.quizzes.getStudentMastery(actor.id, courseId),
      this.quizzes.getSeenQuestionIds(actor.id, courseId),
    ]);

    const target = Math.min(course.quizQuestionCount, allQuestions.length);
    const scored = allQuestions.map((q) => ({
      question: q,
      score: this.computeAdaptiveScore(q, mastery, seenIds),
    }));
    const selected = this.weightedSample(scored, target);

    const generated: GeneratedQuestion[] = selected.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      bloomLevelId: q.bloomLevelId,
      difficultyLevelId: q.difficultyLevelId,
      courseSectionId: q.courseSectionId,
    }));

    const rating = await this.quizzes.currentRating(actor.id, courseId);
    const attemptId = await this.quizzes.insertGenerated({
      userId: actor.id,
      courseId,
      ratingAtGeneration: rating,
      questions: generated,
    });
    return this.requireAttempt(attemptId);
  }

  private computeAdaptiveScore(
    q: PublicQuestion,
    mastery: {
      sections: Map<string, { answered: number; correct: number }>;
      bloom: Map<number, { answered: number; correct: number }>;
      difficulty: Map<number, { answered: number; correct: number }>;
    },
    seenIds: Set<string>,
  ): number {
    const sectionM = mastery.sections.get(q.courseSectionId);
    const sectionGap =
      sectionM === undefined || sectionM.answered === 0
        ? 0.5
        : 1 - sectionM.correct / sectionM.answered;

    const bloomM = mastery.bloom.get(q.bloomLevelId);
    const bloomGap =
      bloomM === undefined || bloomM.answered === 0
        ? 0.5
        : 1 - bloomM.correct / bloomM.answered;

    const diffM = mastery.difficulty.get(q.difficultyLevelId);
    const diffGap =
      diffM === undefined || diffM.answered === 0
        ? 0.5
        : 1 - diffM.correct / diffM.answered;

    return sectionGap * 0.4 + bloomGap * 0.3 + diffGap * 0.2 + (seenIds.has(q.id) ? -0.15 : 0.1);
  }

  private weightedSample<T>(
    items: Array<{ question: T; score: number }>,
    count: number,
  ): T[] {
    const pool = [...items];
    const selected: T[] = [];
    while (selected.length < count && pool.length > 0) {
      const totalWeight = pool.reduce((s, x) => s + Math.max(x.score, 0.01), 0);
      let r = Math.random() * totalWeight;
      let pickedIdx = pool.length - 1;
      for (let i = 0; i < pool.length; i++) {
        r -= Math.max(pool[i].score, 0.01);
        if (r <= 0) {
          pickedIdx = i;
          break;
        }
      }
      selected.push(pool[pickedIdx].question);
      pool.splice(pickedIdx, 1);
    }
    return selected;
  }

  async listOwn(
    actor: AuthUser,
    filters: { courseId: string | undefined; status: string | undefined },
  ) {
    requirePermission(actor, ['quiz.read.self']);
    const items = await this.quizzes.list({
      userId: actor.id,
      organizationId: undefined,
      courseId: filters.courseId,
      status: filters.status,
    });
    return { items };
  }

  async listForOrganization(
    actor: AuthUser,
    filters: {
      organizationId: string | undefined;
      courseId: string | undefined;
      userId: string | undefined;
      status: string | undefined;
    },
  ) {
    requirePermission(actor, ['quiz.read.org']);
    if (
      filters.organizationId !== undefined &&
      filters.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Can only list attempts in your own organisation',
      );
    }
    const items = await this.quizzes.list({
      userId: filters.userId,
      organizationId: actor.organizationId,
      courseId: filters.courseId,
      status: filters.status,
    });
    return { items };
  }

  async getOne(actor: AuthUser, attemptId: string) {
    const attempt = await this.requireAttempt(attemptId);
    this.requireRead(actor, attempt);
    return attempt;
  }

  async start(actor: AuthUser, attemptId: string) {
    requirePermission(actor, ['quiz.attempt']);
    const attempt = await this.requireAttempt(attemptId);
    if (attempt.userId !== actor.id) {
      throw new ForbiddenException('Can only start your own attempt');
    }
    if (attempt.status !== 'generated') {
      throw new ConflictException('Attempt has already been started');
    }
    await this.quizzes.start(attemptId);
    return this.requireAttempt(attemptId);
  }

  async answer(
    actor: AuthUser,
    attemptId: string,
    quizAttemptItemId: string,
    selectedOptionId: string,
  ) {
    requirePermission(actor, ['quiz.attempt']);
    const attempt = await this.requireAttempt(attemptId);
    if (attempt.userId !== actor.id) {
      throw new ForbiddenException('Can only answer your own attempt');
    }
    if (attempt.status !== 'in_progress') {
      throw new ConflictException('Attempt is not in progress');
    }
    const item = await this.quizzes.itemBelongsToAttempt(
      attemptId,
      quizAttemptItemId,
    );
    if (item === undefined) {
      throw new NotFoundException('Quiz item not found on this attempt');
    }
    const optionOk = await this.quizzes.optionBelongsToQuestion(
      selectedOptionId,
      item.questionId,
    );
    if (optionOk === false) {
      throw new BadRequestException(
        'selectedOptionId does not belong to this question',
      );
    }
    const answered = await this.quizzes.answer(
      quizAttemptItemId,
      selectedOptionId,
    );
    if (answered === undefined) {
      throw new NotFoundException('Quiz item or option not found');
    }
    return this.requireAttempt(attemptId);
  }

  async complete(actor: AuthUser, attemptId: string) {
    requirePermission(actor, ['quiz.attempt']);
    const attempt = await this.requireAttempt(attemptId);
    if (attempt.userId !== actor.id) {
      throw new ForbiddenException('Can only complete your own attempt');
    }
    if (attempt.status !== 'in_progress') {
      throw new ConflictException('Attempt is not in progress');
    }
    await this.quizzes.complete(attemptId, actor.id, attempt.courseId);
    return this.requireAttempt(attemptId);
  }

  private requireRead(actor: AuthUser, attempt: PublicAttempt) {
    const isOwn = attempt.userId === actor.id;
    if (isOwn && hasPermission(actor, ['quiz.read.self'])) {
      return;
    }
    if (
      hasPermission(actor, ['quiz.read.org']) &&
      attempt.organizationId === actor.organizationId
    ) {
      return;
    }
    throw new ForbiddenException(
      'Missing permission: quiz.read.self or quiz.read.org',
    );
  }

  private async requireAttempt(attemptId: string): Promise<PublicAttempt> {
    const attempt = await this.quizzes.findById(attemptId);
    if (attempt === undefined) {
      throw new NotFoundException('Quiz attempt not found');
    }
    return attempt;
  }
}

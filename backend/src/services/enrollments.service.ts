import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import { CoursesRepository } from '../repositories/courses.repository';
import {
  EnrollmentsRepository,
  PublicEnrollment,
} from '../repositories/enrollments.repository';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly enrollments: EnrollmentsRepository,
    private readonly courses: CoursesRepository,
    private readonly users: UsersRepository,
  ) {}

  async listOwn(actor: AuthUser, status: string | undefined) {
    requirePermission(actor, ['enrollment.read.self']);
    const items = await this.enrollments.list({
      organizationId: undefined,
      courseId: undefined,
      userId: actor.id,
      status,
    });
    return { items };
  }

  async list(
    actor: AuthUser,
    filters: {
      organizationId: string | undefined;
      courseId: string | undefined;
      userId: string | undefined;
      status: string | undefined;
    },
  ) {
    if (filters.courseId !== undefined) {
      return this.listForCourse(actor, filters.courseId, filters.status);
    }

    requirePermission(actor, ['enrollment.assign']);
    if (actor.organizationId === undefined) {
      throw new ForbiddenException(
        'You need an organisation to list enrolments',
      );
    }
    if (
      filters.organizationId !== undefined &&
      filters.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Can only list enrollments in your own organisation',
      );
    }
    const items = await this.enrollments.list({
      organizationId: actor.organizationId,
      courseId: undefined,
      userId: filters.userId,
      status: filters.status,
    });
    return { items };
  }

  private async listForCourse(
    actor: AuthUser,
    courseId: string,
    status: string | undefined,
  ) {
    const canAssign = hasPermission(actor, ['enrollment.assign']);
    const canAuthorPrivate = hasPermission(actor, ['course.private.read']);
    const canAuthorCommunity = hasPermission(actor, [
      'course.community.update',
    ]);
    if (
      canAssign === false &&
      canAuthorPrivate === false &&
      canAuthorCommunity === false
    ) {
      throw new ForbiddenException(
        'Missing permission: enrollment.assign or course.private.read or course.community.update',
      );
    }

    const course = await this.courses.findById(courseId);
    if (course === undefined) {
      throw new NotFoundException('Course not found');
    }

    if (course.visibility === 'private') {
      if (canAssign === false && canAuthorPrivate === false) {
        throw new ForbiddenException(
          'Missing permission to view private course enrollments',
        );
      }
      if (
        course.organizationId !== undefined &&
        actor.organizationId !== undefined &&
        course.organizationId !== actor.organizationId
      ) {
        throw new ForbiddenException(
          'Can only view enrollments for private courses in your organisation',
        );
      }
      if (actor.organizationId === undefined && canAssign === false) {
        throw new ForbiddenException(
          'You need an organisation to view private course enrollments',
        );
      }
    } else if (canAssign === false && canAuthorCommunity === false) {
      throw new ForbiddenException(
        'Missing permission to view community course enrollments',
      );
    }

    const items = await this.enrollments.list({
      organizationId: undefined,
      courseId,
      userId: undefined,
      status,
    });
    return { items };
  }

  async getOne(actor: AuthUser, enrollmentId: string) {
    const enrollment = await this.requireEnrollment(enrollmentId);
    const isOwn = enrollment.userId === actor.id;
    const sameOrg = enrollment.organizationId === actor.organizationId;
    const canRead =
      (isOwn && hasPermission(actor, ['enrollment.read.self'])) ||
      (sameOrg && hasPermission(actor, ['enrollment.assign']));
    if (canRead === false) {
      throw new ForbiddenException(
        'Missing permission: enrollment.read.self or enrollment.assign',
      );
    }
    return enrollment;
  }

  async assign(actor: AuthUser, userId: string, courseId: string) {
    requirePermission(actor, ['enrollment.assign']);
    const course = await this.courses.findById(courseId);
    if (course === undefined) {
      throw new NotFoundException('Course not found');
    }
    if (course.visibility !== 'private') {
      throw new ForbiddenException(
        'Assign is for private courses; use start-community for community courses',
      );
    }
    if (course.organizationId !== actor.organizationId) {
      throw new ForbiddenException(
        'Can only assign users to private courses in your own organisation',
      );
    }
    if (course.status !== 'active') {
      throw new ForbiddenException('Cannot enrol on a deactivated course');
    }
    const targetUser = await this.users.findById(userId);
    if (targetUser === undefined) {
      throw new NotFoundException('User not found');
    }
    if (targetUser.status !== 'active') {
      throw new ForbiddenException('Cannot enrol a deactivated user');
    }
    if (actor.organizationId === undefined) {
      throw new ForbiddenException(
        'You need an organisation to enrol people on private courses',
      );
    }
    if (targetUser.organizationId === undefined) {
      await this.users.setOrganizationId(userId, actor.organizationId);
    } else if (targetUser.organizationId !== actor.organizationId) {
      throw new ForbiddenException(
        'Can only enrol users in your own organisation or with no organisation',
      );
    }
    return this.ensureActive(userId, courseId);
  }

  async startCommunity(actor: AuthUser, courseId: string) {
    requirePermission(actor, ['course.community.read']);
    const course = await this.courses.findById(courseId);
    if (course === undefined) {
      throw new NotFoundException('Course not found');
    }
    if (course.visibility !== 'community') {
      throw new ForbiddenException('Course is not a community course');
    }
    if (course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }
    return this.ensureActive(actor.id, courseId);
  }

  async withdraw(actor: AuthUser, enrollmentId: string) {
    const enrollment = await this.requireEnrollment(enrollmentId);
    const canWithdrawOwn =
      enrollment.userId === actor.id &&
      hasPermission(actor, ['enrollment.withdraw.self']);
    const canWithdrawOrg =
      enrollment.organizationId === actor.organizationId &&
      hasPermission(actor, ['enrollment.assign']);
    if (canWithdrawOwn === false && canWithdrawOrg === false) {
      throw new ForbiddenException(
        'Missing permission: enrollment.withdraw.self or enrollment.assign',
      );
    }
    await this.enrollments.setStatus(enrollmentId, 'withdrawn');
    return this.requireEnrollment(enrollmentId);
  }

  async activate(actor: AuthUser, enrollmentId: string) {
    requirePermission(actor, ['enrollment.assign']);
    const enrollment = await this.requireEnrollment(enrollmentId);
    if (
      enrollment.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Can only re-activate enrollments in your own organisation',
      );
    }
    await this.enrollments.setStatus(enrollmentId, 'active');
    return this.requireEnrollment(enrollmentId);
  }

  private async ensureActive(
    userId: string,
    courseId: string,
  ): Promise<PublicEnrollment> {
    const existing = await this.enrollments.findByUserAndCourse(
      userId,
      courseId,
    );
    if (existing !== undefined) {
      if (existing.status !== 'active') {
        await this.enrollments.setStatus(existing.id, 'active');
      }
      return this.requireEnrollment(existing.id);
    }
    const enrollmentId = await this.enrollments.insert(userId, courseId);
    return this.requireEnrollment(enrollmentId);
  }

  private async requireEnrollment(
    enrollmentId: string,
  ): Promise<PublicEnrollment> {
    const enrollment = await this.enrollments.findById(enrollmentId);
    if (enrollment === undefined) {
      throw new NotFoundException('Enrollment not found');
    }
    return enrollment;
  }
}

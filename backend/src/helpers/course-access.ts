import { AuthUser } from './auth-user';
import { hasPermission } from './require-permission';

export type CourseAuthoringTarget = {
  visibility: string;
  organizationId: string;
};

export function canAuthorCourse(
  actor: AuthUser,
  course: CourseAuthoringTarget,
): boolean {
  if (course.visibility === 'community') {
    return hasPermission(actor, ['course.community.update']);
  }
  return (
    course.organizationId === actor.organizationId &&
    hasPermission(actor, ['course.private.update'])
  );
}

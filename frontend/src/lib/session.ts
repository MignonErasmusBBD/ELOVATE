export type UserRole =
  | "Learner"
  | "Educator"
  | "Org Admin"
  | "Community Admin"
  | "Platform Admin";

export type CurrentUser = {
  emailAddress: string;
  role: UserRole;
  organizationName: string;
};

const placeholderCurrentUser: CurrentUser = {
  emailAddress: "admin@elovate.dev",
  role: "Org Admin",
  organizationName: "BBD Software",
};

/** Placeholder session until auth is wired to the API. */
export async function getCurrentUser(): Promise<CurrentUser> {
  return placeholderCurrentUser;
}

export type UserRole = "Student" | "Educator";

export type CurrentUser = {
  emailAddress: string;
  role: UserRole;
  organizationName: string;
};

const placeholderCurrentUser: CurrentUser = {
  emailAddress: "student@elovate.dev",
  role: "Student",
  organizationName: "BBD Software",
};

/** Placeholder session until auth is wired to the API. */
export async function getCurrentUser(): Promise<CurrentUser> {
  return placeholderCurrentUser;
}

export type CourseIconName =
  | "eye"
  | "gitBranch"
  | "layers"
  | "code"
  | "server"
  | "checkCircle";

export type Course = {
  id: string;
  title: string;
  description: string;
  iconName: CourseIconName;
};

export type CourseFilter = "all" | "community" | "organisation" | "enrolled";

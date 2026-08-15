export type PlatformNavItemId =
  | "courses"
  | "educator"
  | "organisational-admin"
  | "community-admin"
  | "platform-admin";

export type PlatformNavSectionId = "learning" | "teaching" | "administration";

export type PlatformNavItem = {
  id: PlatformNavItemId;
  href: string;
  label: string;
  description: string;
  sectionId: PlatformNavSectionId;
  allowedRoles: string[];
};

export type PlatformNavSection = {
  id: PlatformNavSectionId;
  label: string;
  items: PlatformNavItem[];
};

export const platformNavItems: PlatformNavItem[] = [
  {
    id: "courses",
    href: "/courses",
    label: "Courses",
    description: "Browse and open your courses",
    sectionId: "learning",
    allowedRoles: [
      "learner",
      "educator",
      "org_admin",
      "community_admin",
      "platform_admin",
    ],
  },
  {
    id: "educator",
    href: "/educator",
    label: "Educator",
    description: "Course analytics and learning content",
    sectionId: "teaching",
    allowedRoles: ["educator", "community_admin"],
  },
  {
    id: "organisational-admin",
    href: "/admin",
    label: "Organisational Admin",
    description: "People, private courses, and enrolments",
    sectionId: "administration",
    allowedRoles: ["org_admin"],
  },
  {
    id: "community-admin",
    href: "/community",
    label: "Community Admin",
    description: "Public course catalog",
    sectionId: "administration",
    allowedRoles: ["community_admin"],
  },
  {
    id: "platform-admin",
    href: "/platform",
    label: "Platform Admin",
    description: "Organisations and global roles",
    sectionId: "administration",
    allowedRoles: ["platform_admin"],
  },
];

const sectionOrder: PlatformNavSectionId[] = [
  "learning",
  "teaching",
  "administration",
];

const sectionLabels: Record<PlatformNavSectionId, string> = {
  learning: "Learning",
  teaching: "Teaching",
  administration: "Administration",
};

export function getPlatformNavItemsForRole(
  role: string,
): PlatformNavItem[] {
  return platformNavItems.filter((item) =>
    item.allowedRoles.includes(role),
  );
}

export function getPlatformNavItemsForRoles(
  roleNames: string[],
): PlatformNavItem[] {
  return platformNavItems.filter((item) =>
    roleNames.some((roleName) => item.allowedRoles.includes(roleName)),
  );
}

/** Full nav for prototyping before role-based access is enforced. */
export function getAllPlatformNavSections(): PlatformNavSection[] {
  return sectionOrder.flatMap((sectionId) => {
    const items = platformNavItems.filter(
      (item) => item.sectionId === sectionId,
    );

    if (items.length === 0) {
      return [];
    }

    return [
      {
        id: sectionId,
        label: sectionLabels[sectionId],
        items,
      },
    ];
  });
}

function groupNavItemsBySection(
  accessibleItems: PlatformNavItem[],
): PlatformNavSection[] {
  return sectionOrder.flatMap((sectionId) => {
    const items = accessibleItems.filter(
      (item) => item.sectionId === sectionId,
    );

    if (items.length === 0) {
      return [];
    }

    return [
      {
        id: sectionId,
        label: sectionLabels[sectionId],
        items,
      },
    ];
  });
}

export function getPlatformNavSectionsForRole(
  role: string,
): PlatformNavSection[] {
  return groupNavItemsBySection(getPlatformNavItemsForRole(role));
}

export function getPlatformNavSectionsForRoles(
  roleNames: string[],
): PlatformNavSection[] {
  return groupNavItemsBySection(getPlatformNavItemsForRoles(roleNames));
}

export function isPlatformNavItemActive(
  pathname: string,
  href: string,
): boolean {
  if (pathname === href) {
    return true;
  }

  if (href === "/courses") {
    return (
      pathname.startsWith("/courses/") ||
      pathname.startsWith("/student/courses/")
    );
  }

  return pathname.startsWith(`${href}/`);
}

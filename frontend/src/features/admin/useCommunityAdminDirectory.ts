import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  ElovateApiError,
  errorMessageFromUnknown,
} from "@/helpers/elovateApi";
import { listCommunityCourses } from "./communityAdminApi";
import type { AdminCourse } from "./types";

type DirectoryCache = {
  courses: AdminCourse[];
  hasLoadedCourses: boolean;
  errorMessage: string | undefined;
};

let directoryCache: DirectoryCache = {
  courses: [],
  hasLoadedCourses: false,
  errorMessage: undefined,
};

let coursesInFlight: Promise<void> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getDirectoryCache() {
  return directoryCache;
}

function rememberDirectory(nextCache: Partial<DirectoryCache>) {
  directoryCache = {
    ...directoryCache,
    ...nextCache,
  };
  for (const listener of listeners) {
    listener();
  }
}

function startCoursesLoad() {
  if (directoryCache.hasLoadedCourses || coursesInFlight !== undefined) {
    return;
  }

  coursesInFlight = listCommunityCourses()
    .then((nextCourses) => {
      rememberDirectory({
        courses: nextCourses,
        hasLoadedCourses: true,
        errorMessage: undefined,
      });
    })
    .catch((error) => {
      const message =
        error instanceof ElovateApiError && error.statusCode === 403
          ? "You need the Community Admin role to manage public courses."
          : errorMessageFromUnknown(error, "Could not load public courses.");
      rememberDirectory({ errorMessage: message });
    })
    .finally(() => {
      coursesInFlight = undefined;
    });
}

export type CommunityAdminDirectory = {
  courses: AdminCourse[];
  isLoadingCourses: boolean;
  errorMessage: string | undefined;
  reload: () => Promise<void>;
  updateCourses: (nextCourses: AdminCourse[]) => void;
};

export function useCommunityAdminDirectory(
  shouldLoad: boolean,
): CommunityAdminDirectory {
  const cache = useSyncExternalStore(
    subscribe,
    getDirectoryCache,
    getDirectoryCache,
  );

  useEffect(() => {
    if (shouldLoad === false) {
      return;
    }
    startCoursesLoad();
  }, [shouldLoad]);

  const reload = useCallback(async () => {
    rememberDirectory({
      hasLoadedCourses: false,
      errorMessage: undefined,
    });
    startCoursesLoad();
    if (coursesInFlight !== undefined) {
      await coursesInFlight;
    }
  }, []);

  return {
    courses: cache.courses,
    isLoadingCourses:
      shouldLoad &&
      cache.hasLoadedCourses === false &&
      cache.errorMessage === undefined,
    errorMessage: cache.errorMessage,
    reload,
    updateCourses: (nextCourses) => {
      rememberDirectory({ courses: nextCourses });
    },
  };
}

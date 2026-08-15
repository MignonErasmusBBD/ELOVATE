import { useCallback, useEffect, useState } from "react";
import {
  ElovateApiError,
  elovateApiJson,
  errorMessageFromUnknown,
} from "@/helpers/elovateApi";
import { parseDirectoryPeople } from "./parseDirectory";
import {
  listOrgEnrolments,
  listOrgPrivateCourses,
  listUnassignedPeople,
} from "./orgAdminApi";
import type { AdminCourse, AdminEnrolment, AdminPerson } from "./types";

type DirectoryCache = {
  people: AdminPerson[];
  unassignedPeople: AdminPerson[];
  courses: AdminCourse[];
  enrolments: AdminEnrolment[];
  hasLoadedPeople: boolean;
  hasLoadedUnassignedPeople: boolean;
  hasLoadedCourses: boolean;
  hasLoadedEnrolments: boolean;
};

let directoryCache: DirectoryCache = {
  people: [],
  unassignedPeople: [],
  courses: [],
  enrolments: [],
  hasLoadedPeople: false,
  hasLoadedUnassignedPeople: false,
  hasLoadedCourses: false,
  hasLoadedEnrolments: false,
};

let peopleInFlight: Promise<void> | undefined;
let unassignedPeopleInFlight: Promise<void> | undefined;
let coursesInFlight: Promise<void> | undefined;
let enrolmentsInFlight: Promise<void> | undefined;

function rememberDirectory(nextCache: Partial<DirectoryCache>) {
  directoryCache = {
    ...directoryCache,
    ...nextCache,
  };
}

export type OrgAdminDirectory = {
  people: AdminPerson[];
  unassignedPeople: AdminPerson[];
  courses: AdminCourse[];
  enrolments: AdminEnrolment[];
  isLoadingPeople: boolean;
  isLoadingUnassignedPeople: boolean;
  isLoadingCourses: boolean;
  isLoadingEnrolments: boolean;
  errorMessage: string | undefined;
  reload: () => Promise<void>;
  updatePeople: (nextPeople: AdminPerson[]) => void;
  updateUnassignedPeople: (nextPeople: AdminPerson[]) => void;
  updateCourses: (nextCourses: AdminCourse[]) => void;
  updateEnrolments: (nextEnrolments: AdminEnrolment[]) => void;
};

export function useOrgAdminDirectory(
  organizationId: string | undefined,
  shouldLoad: boolean,
): OrgAdminDirectory {
  const [people, setPeople] = useState<AdminPerson[]>(directoryCache.people);
  const [unassignedPeople, setUnassignedPeople] = useState<AdminPerson[]>(
    directoryCache.unassignedPeople,
  );
  const [courses, setCourses] = useState<AdminCourse[]>(
    directoryCache.courses,
  );
  const [enrolments, setEnrolments] = useState<AdminEnrolment[]>(
    directoryCache.enrolments,
  );
  const [isLoadingPeople, setIsLoadingPeople] = useState(
    shouldLoad && directoryCache.hasLoadedPeople === false,
  );
  const [isLoadingUnassignedPeople, setIsLoadingUnassignedPeople] = useState(
    shouldLoad && directoryCache.hasLoadedUnassignedPeople === false,
  );
  const [isLoadingCourses, setIsLoadingCourses] = useState(
    shouldLoad && directoryCache.hasLoadedCourses === false,
  );
  const [isLoadingEnrolments, setIsLoadingEnrolments] = useState(
    shouldLoad && directoryCache.hasLoadedEnrolments === false,
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const loadPeople = useCallback(async () => {
    if (directoryCache.hasLoadedPeople) {
      setIsLoadingPeople(false);
      return;
    }
    if (peopleInFlight !== undefined) {
      await peopleInFlight;
      setPeople(directoryCache.people);
      setIsLoadingPeople(false);
      return;
    }

    peopleInFlight = (async () => {
      if (organizationId === undefined) {
        rememberDirectory({
          people: [],
          hasLoadedPeople: true,
        });
        setPeople([]);
        return;
      }

      try {
        const peopleBody = await elovateApiJson(
          `/users?organizationId=${encodeURIComponent(organizationId)}`,
        );
        const nextPeople = parseDirectoryPeople(peopleBody);
        rememberDirectory({
          people: nextPeople,
          hasLoadedPeople: true,
        });
        setPeople(nextPeople);
        setErrorMessage(undefined);
      } catch (error) {
        if (error instanceof ElovateApiError && error.statusCode === 403) {
          setErrorMessage(
            "You need the org_admin role to manage people and enrolments.",
          );
        } else {
          setErrorMessage(
            errorMessageFromUnknown(
              error,
              "Could not load organisation admin data.",
            ),
          );
        }
      }
    })().finally(() => {
      peopleInFlight = undefined;
      setIsLoadingPeople(false);
    });

    await peopleInFlight;
  }, [organizationId]);

  const loadUnassignedPeople = useCallback(async () => {
    if (directoryCache.hasLoadedUnassignedPeople) {
      setIsLoadingUnassignedPeople(false);
      return;
    }
    if (unassignedPeopleInFlight !== undefined) {
      await unassignedPeopleInFlight;
      setUnassignedPeople(directoryCache.unassignedPeople);
      setIsLoadingUnassignedPeople(false);
      return;
    }

    unassignedPeopleInFlight = (async () => {
      try {
        const nextUnassignedPeople = await listUnassignedPeople();
        rememberDirectory({
          unassignedPeople: nextUnassignedPeople,
          hasLoadedUnassignedPeople: true,
        });
        setUnassignedPeople(nextUnassignedPeople);
        setErrorMessage(undefined);
      } catch (error) {
        setErrorMessage(
          errorMessageFromUnknown(
            error,
            "Could not load people without an organisation.",
          ),
        );
      }
    })().finally(() => {
      unassignedPeopleInFlight = undefined;
      setIsLoadingUnassignedPeople(false);
    });

    await unassignedPeopleInFlight;
  }, []);

  const loadCourses = useCallback(async () => {
    if (directoryCache.hasLoadedCourses) {
      setIsLoadingCourses(false);
      return;
    }
    if (coursesInFlight !== undefined) {
      await coursesInFlight;
      setCourses(directoryCache.courses);
      setIsLoadingCourses(false);
      return;
    }

    coursesInFlight = (async () => {
      if (organizationId === undefined) {
        rememberDirectory({
          courses: [],
          hasLoadedCourses: true,
        });
        setCourses([]);
        return;
      }

      try {
        const nextCourses = await listOrgPrivateCourses(organizationId);
        rememberDirectory({
          courses: nextCourses,
          hasLoadedCourses: true,
        });
        setCourses(nextCourses);
        setErrorMessage(undefined);
      } catch (error) {
        setErrorMessage(
          errorMessageFromUnknown(error, "Could not load courses."),
        );
      }
    })().finally(() => {
      coursesInFlight = undefined;
      setIsLoadingCourses(false);
    });

    await coursesInFlight;
  }, [organizationId]);

  const loadEnrolments = useCallback(async () => {
    if (directoryCache.hasLoadedEnrolments) {
      setIsLoadingEnrolments(false);
      return;
    }
    if (enrolmentsInFlight !== undefined) {
      await enrolmentsInFlight;
      setEnrolments(directoryCache.enrolments);
      setIsLoadingEnrolments(false);
      return;
    }

    enrolmentsInFlight = (async () => {
      try {
        const nextEnrolments = await listOrgEnrolments();
        rememberDirectory({
          enrolments: nextEnrolments,
          hasLoadedEnrolments: true,
        });
        setEnrolments(nextEnrolments);
      } catch (error) {
        setErrorMessage(
          errorMessageFromUnknown(error, "Could not load enrolments."),
        );
      }
    })().finally(() => {
      enrolmentsInFlight = undefined;
      setIsLoadingEnrolments(false);
    });

    await enrolmentsInFlight;
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([
      loadPeople(),
      loadUnassignedPeople(),
      loadCourses(),
      loadEnrolments(),
    ]);
  }, [loadCourses, loadEnrolments, loadPeople, loadUnassignedPeople]);

  const reload = useCallback(async () => {
    directoryCache.hasLoadedPeople = false;
    directoryCache.hasLoadedUnassignedPeople = false;
    directoryCache.hasLoadedCourses = false;
    directoryCache.hasLoadedEnrolments = false;
    setIsLoadingPeople(true);
    setIsLoadingUnassignedPeople(true);
    setIsLoadingCourses(true);
    setIsLoadingEnrolments(true);
    await loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (shouldLoad === false) {
      return;
    }
    void loadAll(); // eslint-disable-line react-hooks/set-state-in-effect -- mount fetch
  }, [loadAll, shouldLoad]);

  return {
    people,
    unassignedPeople,
    courses,
    enrolments,
    isLoadingPeople,
    isLoadingUnassignedPeople,
    isLoadingCourses,
    isLoadingEnrolments,
    errorMessage,
    reload,
    updatePeople: (nextPeople) => {
      rememberDirectory({ people: nextPeople });
      setPeople(nextPeople);
    },
    updateUnassignedPeople: (nextPeople) => {
      rememberDirectory({ unassignedPeople: nextPeople });
      setUnassignedPeople(nextPeople);
    },
    updateCourses: (nextCourses) => {
      rememberDirectory({ courses: nextCourses });
      setCourses(nextCourses);
    },
    updateEnrolments: (nextEnrolments) => {
      rememberDirectory({ enrolments: nextEnrolments });
      setEnrolments(nextEnrolments);
    },
  };
}

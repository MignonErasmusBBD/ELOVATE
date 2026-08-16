import { useCallback, useEffect, useState } from "react";
import {
  ElovateApiError,
  elovateApiJson,
  ensureAccessToken,
  errorMessageFromUnknown,
} from "@/helpers/elovateApi";
import {
  parseDirectoryOrganizations,
  parseDirectoryPeople,
  parseDirectoryRoles,
} from "./parseDirectory";
import type { AdminPerson, DirectoryOrganization, DirectoryRole } from "./types";

type DirectoryCache = {
  organizations: DirectoryOrganization[];
  people: AdminPerson[];
  roles: DirectoryRole[];
};

let directoryCache: DirectoryCache = {
  organizations: [],
  people: [],
  roles: [],
};

let hasLoadedDirectory = false;

function rememberDirectory(nextCache: Partial<DirectoryCache>) {
  directoryCache = {
    ...directoryCache,
    ...nextCache,
  };
}

export type PlatformAdminDirectory = {
  organizations: DirectoryOrganization[];
  people: AdminPerson[];
  roles: DirectoryRole[];
  isLoading: boolean;
  errorMessage: string | undefined;
  reload: () => Promise<void>;
  updatePeople: (nextPeople: AdminPerson[]) => void;
  updateOrganizations: (nextOrganizations: DirectoryOrganization[]) => void;
};

export function usePlatformAdminDirectory(
  shouldLoad = true,
): PlatformAdminDirectory {
  const [organizations, setOrganizations] = useState<DirectoryOrganization[]>(
    directoryCache.organizations,
  );
  const [people, setPeople] = useState<AdminPerson[]>(directoryCache.people);
  const [roles, setRoles] = useState<DirectoryRole[]>(directoryCache.roles);
  const [isLoading, setIsLoading] = useState(
    shouldLoad && hasLoadedDirectory === false,
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const reload = useCallback(async () => {
    try {
      await ensureAccessToken();

      const organizationsRequest = elovateApiJson("/organizations").then(
        (body) => {
          const nextOrganizations = parseDirectoryOrganizations(body);
          rememberDirectory({ organizations: nextOrganizations });
          setOrganizations(nextOrganizations);
          setIsLoading(false);
        },
      );
      const peopleRequest = elovateApiJson("/users?status=active").then(
        (body) => {
          const nextPeople = parseDirectoryPeople(body);
          rememberDirectory({ people: nextPeople });
          setPeople(nextPeople);
        },
      );
      const rolesRequest = elovateApiJson("/rbac/roles").then((body) => {
        const nextRoles = parseDirectoryRoles(body);
        rememberDirectory({ roles: nextRoles });
        setRoles(nextRoles);
      });

      await Promise.all([organizationsRequest, peopleRequest, rolesRequest]);
      hasLoadedDirectory = true;
      setErrorMessage(undefined);
    } catch (error) {
      if (error instanceof ElovateApiError && error.statusCode === 403) {
        setErrorMessage(
          "You need the Platform Admin role to manage organisations and roles.",
        );
      } else {
        setErrorMessage(
          errorMessageFromUnknown(error, "Could not load platform admin data."),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shouldLoad === false) {
      return;
    }
    // State updates in reload() run after the network request, not during render.
    void reload(); // eslint-disable-line react-hooks/set-state-in-effect -- mount fetch
  }, [reload, shouldLoad]);

  return {
    organizations,
    people,
    roles,
    isLoading,
    errorMessage,
    reload,
    updatePeople: (nextPeople) => {
      rememberDirectory({ people: nextPeople });
      setPeople(nextPeople);
    },
    updateOrganizations: (nextOrganizations) => {
      rememberDirectory({ organizations: nextOrganizations });
      setOrganizations(nextOrganizations);
    },
  };
}

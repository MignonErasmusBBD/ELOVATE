"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchElovateApi } from "@/helpers/elovateApi";
import {
  parseCurrentUserProfile,
  type CurrentUserProfile,
} from "@/helpers/currentUserProfile";
import { authClient } from "@/lib/auth-client";

type CurrentUserContextValue = {
  profile: CurrentUserProfile | undefined;
  isLoading: boolean;
  errorMessage: string | undefined;
};

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(
  undefined,
);

type CurrentUserProviderProps = {
  children: ReactNode;
};

export function CurrentUserProvider({ children }: CurrentUserProviderProps) {
  const session = authClient.useSession();
  const sessionUser = session.data?.user;
  const isSessionPending = session.isPending;
  const [profile, setProfile] = useState<CurrentUserProfile | undefined>();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (sessionUser === undefined) {
      setProfile(undefined);
      setErrorMessage(undefined);
      setIsProfileLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setIsProfileLoading(true);
      setErrorMessage(undefined);

      try {
        const profileResponse = await fetchElovateApi("/users/me");
        if (profileResponse.ok === false) {
          if (cancelled === false) {
            setProfile(undefined);
            setErrorMessage("Could not load your profile.");
          }
          return;
        }

        const profileBody = await profileResponse.json();
        const parsedProfile = parseCurrentUserProfile(profileBody);
        if (cancelled) {
          return;
        }

        if (parsedProfile === undefined) {
          setProfile(undefined);
          setErrorMessage("Profile response was invalid.");
          return;
        }

        setProfile(parsedProfile);
      } catch {
        if (cancelled === false) {
          setProfile(undefined);
          setErrorMessage("Could not load your profile.");
        }
      } finally {
        if (cancelled === false) {
          setIsProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isSessionPending, sessionUser]);

  const isLoading =
    isSessionPending || (sessionUser !== undefined && isProfileLoading);

  return (
    <CurrentUserContext.Provider
      value={{
        profile,
        isLoading,
        errorMessage,
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const contextValue = useContext(CurrentUserContext);
  if (contextValue === undefined) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return contextValue;
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ACCOUNT_CHANGED_EVENT } from "@/helpers/accountEvents";
import { clearAccessTokenCache, fetchElovateApi } from "@/helpers/elovateApi";
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
  const [hasSessionSettled, setHasSessionSettled] = useState(false);
  const [profile, setProfile] = useState<CurrentUserProfile | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [profileReloadKey, setProfileReloadKey] = useState(0);

  useEffect(() => {
    function handleAccountChanged() {
      setProfileReloadKey((current) => current + 1);
    }

    window.addEventListener(ACCOUNT_CHANGED_EVENT, handleAccountChanged);
    return () => {
      window.removeEventListener(ACCOUNT_CHANGED_EVENT, handleAccountChanged);
    };
  }, []);

  useEffect(() => {
    if (isSessionPending) {
      return;
    }
    setHasSessionSettled(true);

    // Always wipe the cached token when the session identity changes so the
    // next API call fetches a fresh token for the current user.
    clearAccessTokenCache();

    if (sessionUser === undefined) {
      setProfile(undefined);
      setErrorMessage(undefined);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
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
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isSessionPending, sessionUser, profileReloadKey]);

  const isLoading =
    hasSessionSettled === false ||
    isSessionPending ||
    (sessionUser !== undefined &&
      profile === undefined &&
      errorMessage === undefined);

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

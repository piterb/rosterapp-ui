import {
  type Auth0Client,
  type GetTokenSilentlyOptions,
  type RedirectLoginResult,
  createAuth0Client
} from "@auth0/auth0-spa-js";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBasePath, withBasePath } from "../utils/basePath";

type AuthUser = Record<string, unknown> | undefined;

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser;
  hasClient: boolean;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: (options?: GetTokenSilentlyOptions) => Promise<string>;
  handleRedirectCallback: () => Promise<RedirectLoginResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function buildRedirectUri() {
  return `${window.location.origin}${withBasePath("/callback")}`;
}

function buildLogoutUri() {
  const base = getBasePath();
  return `${window.location.origin}${base === "/" ? "" : base}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Auth0Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const domain = import.meta.env.VITE_AUTH0_DOMAIN as string | undefined;
      const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string | undefined;

      if (!domain || !clientId) {
        setIsLoading(false);
        return;
      }

      const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined;

      let auth0Client: Auth0Client;
      try {
        auth0Client = await createAuth0Client({
          domain,
          clientId,
          cacheLocation: "memory",
          useRefreshTokens: true,
          authorizationParams: {
            redirect_uri: buildRedirectUri(),
            audience: audience || undefined
          }
        });
      } catch {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      if (!isMounted) {
        return;
      }

      setClient(auth0Client);
      const authed = await auth0Client.isAuthenticated();
      if (!isMounted) {
        return;
      }
      setIsAuthenticated(authed);
      setUser(authed ? ((await auth0Client.getUser()) as AuthUser) : undefined);
      setIsLoading(false);
    }

    void init();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async () => {
    if (!client) {
      return;
    }
    const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined;
    await client.loginWithRedirect({
      authorizationParams: {
        redirect_uri: buildRedirectUri(),
        audience: audience || undefined
      },
      appState: {
        returnTo: `${window.location.pathname}${window.location.search}`
      }
    });
  }, [client]);

  const logout = useCallback(() => {
    if (!client) {
      return;
    }
    client.logout({
      logoutParams: {
        returnTo: buildLogoutUri()
      }
    });
  }, [client]);

  const getAccessToken = useCallback(
    async (options?: GetTokenSilentlyOptions) => {
      if (!client) {
        throw new Error("Auth0 client not initialized");
      }
      return client.getTokenSilently(options);
    },
    [client]
  );

  const handleRedirectCallback = useCallback(async () => {
    if (!client) {
      throw new Error("Auth0 client not initialized");
    }
    const result = await client.handleRedirectCallback();
    const authed = await client.isAuthenticated();
    setIsAuthenticated(authed);
    setUser(authed ? ((await client.getUser()) as AuthUser) : undefined);
    return result;
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      user,
      hasClient: Boolean(client),
      login,
      logout,
      getAccessToken,
      handleRedirectCallback
    }),
    [isLoading, isAuthenticated, user, client, login, logout, getAccessToken, handleRedirectCallback]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

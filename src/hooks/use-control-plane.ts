"use client";

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { extractRootError } from "@/lib/error-utils";
import type {
  ControlInvite,
  ControlMembership,
  ControlWorkspace,
  ControlWorkspaceOverview,
} from "@/types";
import { useCloudAuth } from "./use-cloud-auth";

interface SyncSettings {
  sync_server_url?: string;
  sync_token?: string;
}

type HttpMethod = "GET" | "POST" | "PATCH";

interface ControlPlaneRuntime {
  baseUrl: string | null;
  token: string | null;
}

interface UseControlPlaneResult {
  runtime: ControlPlaneRuntime;
  isLoading: boolean;
  error: string | null;
  workspaces: ControlWorkspace[];
  selectedWorkspaceId: string | null;
  selectedWorkspace: ControlWorkspace | null;
  overview: ControlWorkspaceOverview | null;
  memberships: ControlMembership[];
  invites: ControlInvite[];
  setSelectedWorkspaceId: (workspaceId: string | null) => void;
  refreshRuntime: () => Promise<void>;
  refreshWorkspaceList: () => Promise<void>;
  refreshWorkspaceDetails: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string, mode: "personal" | "team") => Promise<ControlWorkspace>;
}

function normalizeBaseUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }
  const normalized = url.trim().replace(/\/$/, "");
  return normalized.length > 0 ? normalized : null;
}

export function useControlPlane(): UseControlPlaneResult {
  const { user } = useCloudAuth();
  const [runtime, setRuntime] = useState<ControlPlaneRuntime>({
    baseUrl: null,
    token: null,
  });
  const [workspaces, setWorkspaces] = useState<ControlWorkspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] =
    useState<string | null>(null);
  const [overview, setOverview] = useState<ControlWorkspaceOverview | null>(
    null,
  );
  const [memberships, setMemberships] = useState<ControlMembership[]>([]);
  const [invites, setInvites] = useState<ControlInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async <T>(method: HttpMethod, path: string, body?: unknown): Promise<T> => {
      if (!runtime.baseUrl) {
        throw new Error("control_plane_not_configured");
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-id": user?.id ?? "local-admin",
        "x-user-email": user?.email ?? "local-admin@buglogin.local",
      };

      if (user?.platformRole) {
        headers["x-platform-role"] = user.platformRole;
      }

      if (runtime.token) {
        headers.Authorization = `Bearer ${runtime.token}`;
      }

      const response = await fetch(`${runtime.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const rawBody = await response.text().catch(() => "");
        throw new Error(`control_plane_${response.status}:${rawBody}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    },
    [runtime.baseUrl, runtime.token, user],
  );

  const refreshRuntime = useCallback(async () => {
    const settings = await invoke<SyncSettings>("get_sync_settings");
    setRuntime({
      baseUrl: normalizeBaseUrl(settings.sync_server_url),
      token: settings.sync_token?.trim() || null,
    });
  }, []);

  const refreshWorkspaceList = useCallback(async () => {
    if (!runtime.baseUrl) {
      setWorkspaces([]);
      setSelectedWorkspaceId(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const rows = await request<ControlWorkspace[]>("GET", "/v1/control/workspaces");
      setWorkspaces(rows);
      setSelectedWorkspaceId((current) => {
        if (!rows.length) {
          return null;
        }
        if (current && rows.some((workspace) => workspace.id === current)) {
          return current;
        }
        return rows[0].id;
      });
    } catch (requestError) {
      setError(extractRootError(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [request, runtime.baseUrl]);

  const refreshWorkspaceDetails = useCallback(
    async (workspaceId: string) => {
      if (!runtime.baseUrl || !workspaceId) {
        setOverview(null);
        setMemberships([]);
        setInvites([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [nextOverview, nextMemberships, nextInvites] = await Promise.all([
          request<ControlWorkspaceOverview>(
            "GET",
            `/v1/control/workspaces/${workspaceId}/overview`,
          ),
          request<ControlMembership[]>(
            "GET",
            `/v1/control/workspaces/${workspaceId}/members`,
          ),
          request<ControlInvite[]>(
            "GET",
            `/v1/control/workspaces/${workspaceId}/invites`,
          ),
        ]);
        setOverview(nextOverview);
        setMemberships(nextMemberships);
        setInvites(nextInvites);
      } catch (requestError) {
        setError(extractRootError(requestError));
      } finally {
        setIsLoading(false);
      }
    },
    [request, runtime.baseUrl],
  );

  const createWorkspace = useCallback(
    async (name: string, mode: "personal" | "team") => {
      const created = await request<ControlWorkspace>("POST", "/v1/control/workspaces", {
        name,
        mode,
      });
      await refreshWorkspaceList();
      setSelectedWorkspaceId(created.id);
      return created;
    },
    [refreshWorkspaceList, request],
  );

  useEffect(() => {
    void refreshRuntime();
  }, [refreshRuntime]);

  useEffect(() => {
    void refreshWorkspaceList();
  }, [refreshWorkspaceList]);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setOverview(null);
      setMemberships([]);
      setInvites([]);
      return;
    }
    void refreshWorkspaceDetails(selectedWorkspaceId);
  }, [refreshWorkspaceDetails, selectedWorkspaceId]);

  const selectedWorkspace = useMemo(
    () =>
      selectedWorkspaceId
        ? workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null
        : null,
    [selectedWorkspaceId, workspaces],
  );

  return {
    runtime,
    isLoading,
    error,
    workspaces,
    selectedWorkspaceId,
    selectedWorkspace,
    overview,
    memberships,
    invites,
    setSelectedWorkspaceId,
    refreshRuntime,
    refreshWorkspaceList,
    refreshWorkspaceDetails,
    createWorkspace,
  };
}

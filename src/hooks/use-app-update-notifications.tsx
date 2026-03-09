"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { showToast } from "@/lib/toast-utils";
import type { AppUpdateInfo, AppUpdateProgress } from "@/types";

export function useAppUpdateNotifications() {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] =
    useState<AppUpdateProgress | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const autoDownloadedVersion = useRef<string | null>(null);

  // Ensure we're on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkForAppUpdates = useCallback(async () => {
    if (!isClient) return;
    void dismissedVersion;
  }, [isClient, dismissedVersion]);

  const checkForAppUpdatesManual = useCallback(async () => {
    if (!isClient) return;
    autoDownloadedVersion.current = null;
    setUpdateInfo(null);
    showToast({
      type: "success",
      title: "App updates disabled",
      description:
        "Automatic update checks are disabled in this BugLogin fork.",
      duration: 5000,
    });
  }, [isClient]);

  const dismissAppUpdate = useCallback(() => {
    if (!isClient) return;

    // Remember the dismissed version so we don't show it again
    if (updateInfo) {
      setDismissedVersion(updateInfo.new_version);
      console.log("Dismissed app update version:", updateInfo.new_version);
    }

    setUpdateInfo(null);
  }, [isClient, updateInfo]);

  // Auto-download update in background when found
  useEffect(() => {
    if (!isClient) return;
    if (updateInfo || isUpdating || updateReady || updateProgress) {
      setUpdateInfo(null);
      setIsUpdating(false);
      setUpdateReady(false);
      setUpdateProgress(null);
    }
  }, [isClient, updateInfo, isUpdating, updateReady, updateProgress]);

  // Check for app updates on startup
  useEffect(() => {
    if (!isClient) return;

    // Check for updates immediately on startup
    void checkForAppUpdates();
  }, [isClient, checkForAppUpdates]);

  return {
    updateInfo,
    isUpdating,
    updateProgress,
    updateReady,
    checkForAppUpdates,
    checkForAppUpdatesManual,
    dismissAppUpdate,
  };
}

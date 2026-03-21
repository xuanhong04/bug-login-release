import type { TeamRole } from "@/types";

export type AuthLoginScope = "workspace_user" | "platform_admin";

export type AuthQuickPreset = {
  id: string;
  labelKey: string;
  email: string;
  scope: AuthLoginScope;
};

export const AUTH_QUICK_PRESETS: readonly AuthQuickPreset[] = [
  {
    id: "platform_admin",
    labelKey: "authDialog.quickPresetPlatformAdmin",
    email: "platform.admin@buglogin.local",
    scope: "platform_admin",
  },
  {
    id: "owner",
    labelKey: "authDialog.quickPresetOwner",
    email: "owner.preview@buglogin.local",
    scope: "workspace_user",
  },
  {
    id: "admin",
    labelKey: "authDialog.quickPresetAdmin",
    email: "admin.preview@buglogin.local",
    scope: "workspace_user",
  },
  {
    id: "member",
    labelKey: "authDialog.quickPresetMember",
    email: "member.preview@buglogin.local",
    scope: "workspace_user",
  },
  {
    id: "viewer",
    labelKey: "authDialog.quickPresetViewer",
    email: "viewer.preview@buglogin.local",
    scope: "workspace_user",
  },
];

export function getPreviewRoleByEmail(email: string): TeamRole | null {
  switch (email.trim().toLowerCase()) {
    case "owner.preview@buglogin.local":
      return "owner";
    case "admin.preview@buglogin.local":
      return "admin";
    case "member.preview@buglogin.local":
      return "member";
    case "viewer.preview@buglogin.local":
      return "viewer";
    default:
      return null;
  }
}

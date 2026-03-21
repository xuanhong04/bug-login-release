"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCloudAuth } from "@/hooks/use-cloud-auth";
import {
  type AuthLoginScope,
  AUTH_QUICK_PRESETS,
} from "@/lib/auth-quick-presets";
import { acceptControlInviteIfProvided } from "@/lib/control-invite";
import { extractRootError } from "@/lib/error-utils";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import { LoadingButton } from "./loading-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface CloudAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledInviteToken?: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function CloudAuthDialog({
  isOpen,
  onClose,
  prefilledInviteToken = null,
}: CloudAuthDialogProps) {
  const { t } = useTranslation();
  const { loginWithEmail, refreshProfile } = useCloudAuth();
  const [email, setEmail] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [loginScope, setLoginScope] = useState<AuthLoginScope>("workspace_user");
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setInviteToken("");
      setLoginScope("workspace_user");
      setIsSigningIn(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !prefilledInviteToken) {
      return;
    }
    setInviteToken(prefilledInviteToken);
  }, [isOpen, prefilledInviteToken]);

  const handleSignIn = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      showErrorToast(t("authDialog.invalidEmail"));
      return;
    }

    try {
      setIsSigningIn(true);
      const hasInviteToken = inviteToken.trim().length > 0;
      const authState = await loginWithEmail(normalizedEmail, {
        scope: loginScope,
        allowUnassigned: hasInviteToken,
      });
      try {
        const inviteStatus = await acceptControlInviteIfProvided({
          token: inviteToken,
          userId: authState.user.id,
          email: authState.user.email,
          platformRole: authState.user.platformRole,
        });
        if (inviteStatus === "accepted") {
          showSuccessToast(t("authDialog.inviteAccepted"));
        }
      } catch (inviteError) {
        const inviteMessage = extractRootError(inviteError);
        if (inviteMessage.includes("invite_server_missing")) {
          showErrorToast(t("authDialog.inviteServerMissing"));
        } else {
          showErrorToast(t("authDialog.inviteAcceptFailed"), {
            description: inviteMessage,
          });
        }
      }
      await refreshProfile().catch(() => null);
      showSuccessToast(t("authDialog.loginSuccess"));
      onClose();
    } catch (error) {
      const message = extractRootError(error);
      if (message.includes("invite_required")) {
        showErrorToast(t("authDialog.inviteRequired"));
        return;
      }
      showErrorToast(t("authDialog.loginFailed"), {
        description: message,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("authDialog.title")}</DialogTitle>
          <DialogDescription>{t("authDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border border-border bg-muted px-3 py-2">
            <p className="text-xs font-medium text-foreground">
              {t("authDialog.googlePendingTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("authDialog.googlePendingDescription")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cloud-auth-email">
              {t("authDialog.emailLabel")}
            </Label>
            <Input
              id="cloud-auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("authDialog.emailPlaceholder")}
              disabled={isSigningIn}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">
              {t("authDialog.quickPresetTitle")}
            </p>
            <div className="flex flex-wrap gap-2">
              {AUTH_QUICK_PRESETS.map((preset) => (
                <LoadingButton
                  key={preset.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSigningIn}
                  isLoading={false}
                  onClick={() => {
                    setEmail(preset.email);
                    setLoginScope(preset.scope);
                  }}
                >
                  {t(preset.labelKey)}
                </LoadingButton>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("authDialog.quickPresetHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cloud-auth-scope">{t("authDialog.accessScopeLabel")}</Label>
            <Select
              value={loginScope}
              onValueChange={(value) =>
                setLoginScope(value as AuthLoginScope)
              }
              disabled={isSigningIn}
            >
              <SelectTrigger id="cloud-auth-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workspace_user">
                  {t("authDialog.accessScopeUser")}
                </SelectItem>
                <SelectItem value="platform_admin">
                  {t("authDialog.accessScopeAdmin")}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("authDialog.accessScopeHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cloud-auth-invite-token">
              {t("authDialog.inviteTokenLabel")}
            </Label>
            <Input
              id="cloud-auth-invite-token"
              value={inviteToken}
              onChange={(event) => setInviteToken(event.target.value)}
              placeholder={t("authDialog.inviteTokenPlaceholder")}
              disabled={isSigningIn}
            />
            <p className="text-xs text-muted-foreground">
              {t("authDialog.inviteTokenHint")}
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap justify-between gap-2">
          <LoadingButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSigningIn}
            isLoading={false}
          >
            {t("common.buttons.cancel")}
          </LoadingButton>
          <LoadingButton
            type="button"
            onClick={handleSignIn}
            isLoading={isSigningIn}
            disabled={isSigningIn}
          >
            {t("authDialog.signInWithEmail")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

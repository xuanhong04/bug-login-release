"use client";

import { Check, Crown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCloudAuth } from "@/hooks/use-cloud-auth";
import {
  type AuthLoginScope,
  AUTH_QUICK_PRESETS,
} from "@/lib/auth-quick-presets";
import { acceptControlInviteIfProvided } from "@/lib/control-invite";
import { extractRootError } from "@/lib/error-utils";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import type { RuntimeConfigStatus } from "@/types";
import { LoadingButton } from "./loading-button";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type BillingCycle = "monthly" | "yearly";

type PlanDefinition = {
  id: "starter" | "growth" | "scale";
  monthlyPrice: number;
  yearlyPrice: number;
  profiles: number;
  members: number;
  storageGb: number;
  support: "email" | "priority" | "dedicated";
  recommended?: boolean;
};

const PLAN_DEFINITIONS: readonly PlanDefinition[] = [
  {
    id: "starter",
    monthlyPrice: 9,
    yearlyPrice: 7,
    profiles: 30,
    members: 1,
    storageGb: 5,
    support: "email",
  },
  {
    id: "growth",
    monthlyPrice: 19,
    yearlyPrice: 15,
    profiles: 120,
    members: 5,
    storageGb: 20,
    support: "priority",
    recommended: true,
  },
  {
    id: "scale",
    monthlyPrice: 39,
    yearlyPrice: 31,
    profiles: 500,
    members: 25,
    storageGb: 80,
    support: "dedicated",
  },
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface AuthPricingWorkspaceProps {
  runtimeConfig: RuntimeConfigStatus | null;
  onOpenSyncConfig: () => void;
}

export function AuthPricingWorkspace({
  runtimeConfig,
  onOpenSyncConfig,
}: AuthPricingWorkspaceProps) {
  const { t } = useTranslation();
  const { loginWithEmail, refreshProfile } = useCloudAuth();
  const [email, setEmail] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [scope, setScope] = useState<AuthLoginScope>("workspace_user");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<PlanDefinition["id"]>(
    "growth",
  );

  const selectedPlan = PLAN_DEFINITIONS.find((plan) => plan.id === selectedPlanId);

  const handleSelectPlan = (plan: PlanDefinition) => {
    setSelectedPlanId(plan.id);
    showSuccessToast(t("authLanding.planSelected"), {
      description: `${t(`authLanding.plans.${plan.id}.name`)} • $${billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}/${billingCycle === "monthly" ? t("authLanding.perMonth") : t("authLanding.perYear")}`,
    });
  };

  const handleSignIn = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      showErrorToast(t("authDialog.invalidEmail"));
      return;
    }

    try {
      setIsSigningIn(true);
      const hasInvite = inviteToken.trim().length > 0;
      const state = await loginWithEmail(normalizedEmail, {
        scope,
        allowUnassigned: hasInvite,
      });

      try {
        const inviteStatus = await acceptControlInviteIfProvided({
          token: inviteToken,
          userId: state.user.id,
          email: state.user.email,
          platformRole: state.user.platformRole,
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
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("authLanding.pricingTitle")}</CardTitle>
            <CardDescription>{t("authLanding.pricingDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={billingCycle === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setBillingCycle("monthly")}
              >
                {t("authLanding.monthly")}
              </Button>
              <Button
                type="button"
                variant={billingCycle === "yearly" ? "default" : "outline"}
                size="sm"
                onClick={() => setBillingCycle("yearly")}
              >
                {t("authLanding.yearly")}
              </Button>
              <Badge variant="secondary">{t("authLanding.yearlySave")}</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {PLAN_DEFINITIONS.map((plan) => {
                const price =
                  billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
                const isSelected = selectedPlanId === plan.id;
                return (
                  <Card key={plan.id} className={isSelected ? "border-primary" : undefined}>
                    <CardHeader className="space-y-2 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm">
                          {t(`authLanding.plans.${plan.id}.name`)}
                        </CardTitle>
                        {plan.recommended && (
                          <Badge variant="secondary">
                            <Crown className="mr-1 h-3 w-3" />
                            {t("authLanding.recommended")}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {t(`authLanding.plans.${plan.id}.description`)}
                      </CardDescription>
                      <div className="text-lg font-semibold text-foreground">
                        ${price}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          /{billingCycle === "monthly" ? t("authLanding.perMonth") : t("authLanding.perYear")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("authLanding.featureProfiles", { count: plan.profiles })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("authLanding.featureMembers", { count: plan.members })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("authLanding.featureStorage", { count: plan.storageGb })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("authLanding.featureSupport", {
                          level: t(`authLanding.support.${plan.support}`),
                        })}
                      </div>
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="mt-2 w-full"
                        onClick={() => handleSelectPlan(plan)}
                      >
                        {isSelected
                          ? t("authLanding.selectedPlan")
                          : t("authLanding.selectPlan")}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              {runtimeConfig?.stripe === "ready"
                ? t("authLanding.stripeReady")
                : t("authLanding.stripePending")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("authLanding.signInTitle")}</CardTitle>
            <CardDescription>{t("authLanding.signInDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="auth-pricing-email">{t("authDialog.emailLabel")}</Label>
              <Input
                id="auth-pricing-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("authDialog.emailPlaceholder")}
                disabled={isSigningIn}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-pricing-scope">{t("authDialog.accessScopeLabel")}</Label>
              <Select
                value={scope}
                onValueChange={(value) => setScope(value as AuthLoginScope)}
                disabled={isSigningIn}
              >
                <SelectTrigger id="auth-pricing-scope">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-pricing-invite">{t("authDialog.inviteTokenLabel")}</Label>
              <Input
                id="auth-pricing-invite"
                value={inviteToken}
                onChange={(event) => setInviteToken(event.target.value)}
                placeholder={t("authDialog.inviteTokenPlaceholder")}
                disabled={isSigningIn}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                {t("authDialog.quickPresetTitle")}
              </p>
              <div className="flex flex-wrap gap-2">
                {AUTH_QUICK_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSigningIn}
                    onClick={() => {
                      setEmail(preset.email);
                      setScope(preset.scope);
                    }}
                  >
                    {t(preset.labelKey)}
                  </Button>
                ))}
              </div>
            </div>

            <LoadingButton
              type="button"
              className="w-full"
              onClick={handleSignIn}
              isLoading={isSigningIn}
              disabled={isSigningIn}
            >
              {selectedPlan
                ? `${t("authDialog.signInWithEmail")} • ${t(`authLanding.plans.${selectedPlan.id}.name`)}`
                : t("authDialog.signInWithEmail")}
            </LoadingButton>

            <div className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              {runtimeConfig?.s3_sync === "ready"
                ? t("authLanding.syncReady")
                : t("authLanding.syncPending")}
            </div>

            {runtimeConfig?.s3_sync !== "ready" && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onOpenSyncConfig}
              >
                {t("authLanding.openSyncConfig")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

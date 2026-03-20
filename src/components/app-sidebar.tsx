"use client";

import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  LuChevronLeft,
  LuChevronRight,
  LuGlobe,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuSettings2,
  LuShield,
  LuSquareTerminal,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { AppSection } from "@/types";
import { Logo } from "./icons/logo";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type NavItem = {
  id: AppSection;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "profiles",
    labelKey: "shell.sections.profiles",
    icon: LuSquareTerminal,
  },
  {
    id: "proxies",
    labelKey: "shell.sections.proxies",
    icon: LuGlobe,
  },
  {
    id: "integrations",
    labelKey: "shell.sections.integrations",
    icon: LuShield,
  },
  {
    id: "settings",
    labelKey: "shell.sections.settings",
    icon: LuSettings2,
  },
];

type Props = {
  activeSection: AppSection;
  collapsed: boolean;
  onSectionChange: (section: AppSection) => void;
  onCollapsedChange: (collapsed: boolean) => void;
};

export function AppSidebar({
  activeSection,
  collapsed,
  onSectionChange,
  onCollapsedChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "app-sidebar-font flex h-screen flex-col border-r bg-background/80 text-[12.5px] tracking-[-0.005em] transition-all duration-300",
        collapsed ? "w-[88px]" : "w-[264px]",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-4 py-5",
          collapsed && "px-3",
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Logo className="h-10 w-10 shrink-0" />
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="shrink-0"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={
            collapsed ? t("shell.expandSidebar") : t("shell.collapseSidebar")
          }
          title={
            collapsed ? t("shell.expandSidebar") : t("shell.collapseSidebar")
          }
        >
          {collapsed ? (
            <LuPanelLeftOpen className="h-4 w-4" />
          ) : (
            <LuPanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const button = (
            <button
              type="button"
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors",
                "text-[13px] leading-tight",
                activeSection === item.id
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="truncate">{t(item.labelKey)}</span>
              )}
              {!collapsed && activeSection === item.id && (
                <LuChevronRight className="ml-auto h-4 w-4 shrink-0" />
              )}
            </button>
          );

          if (!collapsed) {
            return button;
          }

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="border-t px-3 py-4">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border bg-muted/20 px-3 py-3",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <LuChevronLeft className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {t("shell.workspaceMode")}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t("shell.workspaceHint")}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

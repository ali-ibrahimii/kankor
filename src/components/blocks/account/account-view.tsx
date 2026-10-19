"use client";

import { AlertTriangleIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CurrentUser } from "@/lib/auth/types";
import { AccountDangerZone } from "./account-danger-zone";
import { AccountProfileForm } from "./account-profile-form";
import { AccountSecurityForm } from "./account-security-form";

interface AccountViewProps {
	user: CurrentUser;
}

export function AccountView({ user }: AccountViewProps) {
	const t = useTranslations("account");

	return (
		<div className="container max-w-4xl mx-auto space-y-8 p-4 md:p-8">
			{/* Page Header */}
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
					{t("title")}
				</h1>
				<p className="text-muted-foreground text-sm md:text-base">
					{t("subtitle")}
				</p>
			</div>

			{/* Account Tabs */}
			<Tabs defaultValue="profile" className="space-y-6">
				<TabsList className="grid w-full grid-cols-3 max-w-md">
					<TabsTrigger value="profile" className="gap-2">
						<UserIcon className="size-4" />
						<span>{t("tabs.profile")}</span>
					</TabsTrigger>
					<TabsTrigger value="security" className="gap-2">
						<ShieldCheckIcon className="size-4" />
						<span>{t("tabs.security")}</span>
					</TabsTrigger>
					<TabsTrigger
						value="dangerZone"
						className="gap-2 text-destructive data-[state=active]:text-destructive"
					>
						<AlertTriangleIcon className="size-4 text-destructive" />
						<span>{t("tabs.dangerZone")}</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="profile" className="space-y-6">
					<AccountProfileForm user={user} />
				</TabsContent>

				<TabsContent value="security" className="space-y-6">
					<AccountSecurityForm user={user} />
				</TabsContent>

				<TabsContent value="dangerZone" className="space-y-6">
					<AccountDangerZone />
				</TabsContent>
			</Tabs>
		</div>
	);
}

import { Bell, Palette, UserCircle, Wallet } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
import { ThemeSwitcher } from "@/components/widgets/theme-switcher";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InstructorSettingsPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const [t, user] = await Promise.all([
		getTranslations("dashboard.instructor"),
		getCurrentUser(),
	]);
	if (!user) redirect(routes.auth.login.page(undefined, { locale }));

	return (
		<div className="space-y-6 p-6">
			{/* Page header */}
			<div>
				<h1 className="text-xl font-bold">{t("settingsPage.title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("settingsPage.description")}
				</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				{/* Account */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<UserCircle className="size-5 text-muted-foreground" />
							{t("settingsPage.accountTitle")}
						</CardTitle>
						<CardDescription>
							{t("settingsPage.accountDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="mb-3 text-sm">
							<span className="font-medium">
								{user.full_name || user.email || "—"}
							</span>
							{user.email && (
								<span className="ms-2 text-xs text-muted-foreground">
									{user.email}
								</span>
							)}
						</p>
						<Button variant="outline" size="sm" asChild>
							<Link href={routes.d.instructor.account.page()}>
								{t("settingsPage.manageAccount")}
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Notifications */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bell className="size-5 text-muted-foreground" />
							{t("settingsPage.notificationsTitle")}
						</CardTitle>
						<CardDescription>
							{t("settingsPage.notificationsDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="outline" size="sm" asChild>
							<Link href={routes.d.instructor.notifications.page()}>
								{t("settingsPage.manageNotifications")}
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Earnings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Wallet className="size-5 text-muted-foreground" />
							{t("settingsPage.earningsTitle")}
						</CardTitle>
						<CardDescription>
							{t("settingsPage.earningsDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="outline" size="sm" asChild>
							<Link href={routes.d.instructor.earnings.page()}>
								{t("settingsPage.manageEarnings")}
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Appearance */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Palette className="size-5 text-muted-foreground" />
							{t("settingsPage.appearanceTitle")}
						</CardTitle>
						<CardDescription>
							{t("settingsPage.appearanceDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between gap-4">
							<span className="text-sm">{t("settingsPage.languageLabel")}</span>
							<LocaleSwitcher />
						</div>
						<Separator />
						<div className="flex items-center justify-between gap-4">
							<span className="text-sm">{t("settingsPage.themeLabel")}</span>
							<ThemeSwitcher label={t("settingsPage.themeLabel")} />
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

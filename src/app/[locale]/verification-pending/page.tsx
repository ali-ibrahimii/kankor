import { Clock } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Link, redirect } from "@/i18n/navigation";
import { getDashboardPath } from "@/lib/auth/auth.util";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { BaseParams } from "@/types/common.types";

type PendingType = "instructor" | "school";

function resolveType(value: string | undefined): PendingType | "default" {
	if (value === "instructor" || value === "school") return value;
	return "default";
}

/**
 * Shown when an instructor or school account still needs manual admin
 * approval. The instructor layout and school layout redirect here while the
 * relevant account status is not yet `active`.
 */
export default async function VerificationPendingPage({
	params,
	searchParams,
}: {
	params: Promise<BaseParams>;
	searchParams: Promise<{ type?: string }>;
}) {
	const [{ locale }, { type }] = await Promise.all([params, searchParams]);
	setRequestLocale(locale);

	const t = await getTranslations("verificationPending");
	const user = await getCurrentUser();
	const kind = resolveType(type);

	if (user) {
		redirect({ href: getDashboardPath(user), locale });
	}

	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
			<div className="flex w-full max-w-md flex-col gap-6">
				<Card>
					<CardHeader className="items-center text-center">
						<div className="mb-2 flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
							<Clock className="size-7" />
						</div>
						<Badge
							variant="secondary"
							className="mb-1 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
						>
							{t("statusBadge")}
						</Badge>
						<CardTitle className="text-xl">{t(`${kind}.title`)}</CardTitle>
						<CardDescription>{t(`${kind}.body`)}</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<Button asChild variant="outline" className="w-full">
							<Link href={routes.home.page()}>{t("backHome")}</Link>
						</Button>
						<form action="/api/auth/signout" method="post">
							<Button type="submit" variant="ghost" className="w-full">
								{t("signOut")}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

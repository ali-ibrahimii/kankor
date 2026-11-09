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
import {
	getDashboardPath,
	isInstructor,
	isSuperAdmin,
} from "@/lib/auth/auth.util";
import { getCurrentUser } from "@/lib/auth/session";
import type { CurrentUser } from "@/lib/auth/types";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { BaseParams } from "@/types/common.types";

type PendingType = "instructor" | "school";

function resolveType(value: string | undefined): PendingType | "default" {
	if (value === "instructor" || value === "school") return value;
	return "default";
}

/**
 * Whether the account belongs to one of the statuses that lock a dashboard
 * (anything other than `active`), so the copy can explain *why* rather than
 * always saying "under review". A `null` instructor status is the value a
 * freshly signed-up instructor carries, so it means "pending".
 */
type GatedStatus = "pending" | "suspended" | "disabled";

function gatedStatusOf(
	status: CurrentUser["instructor_status"] | string | null | undefined
): GatedStatus | null {
	if (status === "suspended") return "suspended";
	if (status === "disabled" || status === "rejected") return "disabled";
	if (status == null || status === "pending") return "pending";
	return null;
}

/**
 * True when the dashboard `getDashboardPath(user)` points at would *reject*
 * this user and send them right back here — i.e. this page is genuinely their
 * destination.
 *
 * This mirrors the guards in the instructor and school layouts exactly:
 *
 *   • instructor layout  → `instructor_status !== "active"`
 *   • school layout      → `schools.status !== "active"` for the school in the URL
 *
 * Students, admins, and agency members have no approval gate, so they are
 * never "awaiting verification" and always get forwarded to their dashboard.
 */
async function isDashboardGated(
	user: CurrentUser
): Promise<{ gated: boolean; status: GatedStatus | null }> {
	if (isSuperAdmin(user)) return { gated: false, status: null };

	if (isInstructor(user)) {
		const status = gatedStatusOf(user.instructor_status);
		return { gated: status !== null, status };
	}

	const schoolId = user.schoolMemberships[0]?.school_id;
	if (!schoolId) return { gated: false, status: null };

	// Same reasoning as getDashboardPath(): the primary school membership is
	// the dashboard this user lands on, so its status is the one that matters.
	const supabase = await createClient();
	const { data } = await supabase
		.from("schools")
		.select("status")
		.eq("id", schoolId)
		.maybeSingle();

	// An unreadable/missing row is treated as not-yet-approved so the page
	// renders instead of bouncing the user back into a redirect loop.
	const status = gatedStatusOf(data?.status ?? null);
	return { gated: status !== null, status };
}

/**
 * Shown when an instructor or school account still needs manual admin
 * approval. The instructor layout and school layout redirect here while the
 * relevant account status is not yet `active`.
 *
 * IMPORTANT: this page must never redirect a user whose own dashboard would
 * just send them back here. It used to forward *every* signed-in visitor to
 * `getDashboardPath(user)`, which meant an unverified instructor bounced
 *
 *     /d/instructor → /verification-pending → /d/instructor → …
 *
 * until the browser gave up with ERR_TOO_MANY_REDIRECTS — i.e. the dashboard
 * simply never loaded. Only users whose account is already approved are
 * forwarded; everyone else gets the pending-state screen.
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

	let gatedStatus: GatedStatus | null = null;

	if (user) {
		const gate = await isDashboardGated(user);
		if (!gate.gated) {
			redirect({ href: getDashboardPath(user), locale });
		}
		gatedStatus = gate.status;
	}

	// Suspended/disabled accounts are not "under review" — say what actually
	// happened instead of telling them to wait for an approval that already
	// went the other way.
	const statusKey =
		gatedStatus === "suspended"
			? "suspended"
			: gatedStatus === "disabled"
				? "disabled"
				: null;
	const titleKey = statusKey ? `${statusKey}.title` : `${kind}.title`;
	const bodyKey = statusKey ? `${statusKey}.body` : `${kind}.body`;
	const badgeKey = statusKey ? `${statusKey}.badge` : "statusBadge";

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
							{t(badgeKey)}
						</Badge>
						<CardTitle className="text-xl">{t(titleKey)}</CardTitle>
						<CardDescription>{t(bodyKey)}</CardDescription>
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

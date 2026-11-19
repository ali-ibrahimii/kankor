import { ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { isSupabaseServerConfigured } from "@/lib/env/server-env";
import { createClient } from "@/lib/supabase/server";

export default async function AdminStaffPage() {
	const [t, locale] = await Promise.all([
		getTranslations("adminCatalog"),
		getLocale(),
	]);

	const dateFormat = new Intl.DateTimeFormat(
		locale === "en" ? "en-US" : locale === "ps" ? "ps-AF" : "fa-AF",
		{ dateStyle: "medium" }
	);

	let staff: Array<{
		id: string;
		full_name: string | null;
		email: string | null;
		phone: string | null;
		created_at: string | null;
	}> = [];

	if (isSupabaseServerConfigured) {
		const supabase = await createClient();
		const { data } = await supabase
			.from("profiles")
			.select("id, full_name, email, phone, created_at")
			.eq("role", "admin")
			.order("created_at", { ascending: false });
		staff = data ?? [];
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("staff.title")}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("staff.description")}
					</p>
				</div>
				<Badge variant="secondary" className="text-xs">
					{t("totalCount", { count: staff.length })}
				</Badge>
			</div>

			<div className="overflow-hidden rounded-xl border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("name")}</TableHead>
							<TableHead>{t("staff.email")}</TableHead>
							<TableHead>{t("staff.phone")}</TableHead>
							<TableHead>{t("staff.role")}</TableHead>
							<TableHead>{t("createdAt")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{staff.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="py-12 text-center text-sm text-muted-foreground"
								>
									{t("empty")}
								</TableCell>
							</TableRow>
						) : (
							staff.map((member) => (
								<TableRow key={member.id}>
									<TableCell className="font-medium">
										{member.full_name || "—"}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{member.email || "—"}
									</TableCell>
									<TableCell className="text-muted-foreground" dir="ltr">
										{member.phone || "—"}
									</TableCell>
									<TableCell>
										<Badge variant="secondary" className="gap-1 text-xs">
											<ShieldCheck className="size-3" />
											{t("staff.adminBadge")}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{member.created_at
											? dateFormat.format(new Date(member.created_at))
											: "—"}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

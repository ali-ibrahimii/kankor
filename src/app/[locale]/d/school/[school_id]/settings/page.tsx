import { getTranslations, setRequestLocale } from "next-intl/server";
import { SchoolBrandingCard } from "@/components/blocks/school/school-branding-card";
import { SchoolSettingsForm } from "@/components/blocks/school/school-settings-form";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

// ─── Data fetching ────────────────────────────────────────────────────────────

type SchoolRow = {
	name: string | null;
	address: string | null;
	province_id: string | null;
	admin_email: string | null;
	cover_image_url: string | null;
	logo_url: string | null;
	status: string;
};

async function getSchool(schoolId: string): Promise<SchoolRow | null> {
	const supabase = await createClient();
	const { data } = await supabase
		.from("schools")
		.select(
			"name, address, province_id, admin_email, cover_image_url, logo_url, status"
		)
		.eq("id", schoolId)
		.maybeSingle();
	return (data as SchoolRow | null) ?? null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SchoolSettingsPage({
	params,
}: {
	params: Promise<BaseParams & { school_id: string }>;
}) {
	const { locale, school_id } = await params;
	setRequestLocale(locale);

	const [t, school] = await Promise.all([
		getTranslations("schoolSettings"),
		getSchool(school_id),
	]);

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			<section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
				<h2 className="text-sm font-black">{t("infoTitle")}</h2>
				<p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
					{t("infoDescription")}
				</p>
				<div className="mt-4">
					<SchoolSettingsForm
						schoolId={school_id}
						initialValues={{
							name: school?.name ?? "",
							address: school?.address ?? "",
							provinceId: school?.province_id ?? "",
							adminEmail: school?.admin_email ?? "",
						}}
					/>
				</div>
			</section>

			<SchoolBrandingCard
				schoolId={school_id}
				initialCover={school?.cover_image_url ?? null}
				initialLogo={school?.logo_url ?? null}
				canEdit
			/>
		</div>
	);
}

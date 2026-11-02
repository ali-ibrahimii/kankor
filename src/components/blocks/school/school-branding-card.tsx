"use client";

import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { ImageUploadField } from "@/components/blocks/shared/image-upload-field";

/**
 * School cover + logo, both stored in Cloudflare R2 (`schools/{id}/…`) and
 * written back onto `schools.cover_image_url` / `schools.logo_url`.
 *
 * Shown to whoever can manage the school — the server page decides that, and
 * the upload itself is authorized again by `can_manage_image_owner`.
 */
export function SchoolBrandingCard({
	schoolId,
	initialCover,
	initialLogo,
	canEdit,
}: {
	schoolId: string;
	initialCover?: string | null;
	initialLogo?: string | null;
	canEdit: boolean;
}) {
	const t = useTranslations("dashboard.school.branding");
	const [cover, setCover] = React.useState<string | null>(initialCover ?? null);
	const [logo, setLogo] = React.useState<string | null>(initialLogo ?? null);

	return (
		<section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
			<div className="flex items-start gap-2">
				<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<ImageIcon className="size-4" />
				</span>
				<div className="min-w-0">
					<h2 className="text-sm font-black">{t("title")}</h2>
					<p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
						{t("description")}
					</p>
				</div>
			</div>

			<div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
				<div className="min-w-0 flex-1 space-y-1.5">
					<p className="text-[11px] font-bold text-muted-foreground">
						{t("coverLabel")}
					</p>
					<ImageUploadField
						scope="school"
						ownerId={schoolId}
						target="cover"
						value={cover}
						disabled={!canEdit}
						onUploaded={({ url }) => setCover(url)}
						onRemoved={() => setCover(null)}
					/>
				</div>

				<div className="space-y-1.5">
					<p className="text-[11px] font-bold text-muted-foreground">
						{t("logoLabel")}
					</p>
					<ImageUploadField
						scope="school"
						ownerId={schoolId}
						target="logo"
						aspect="logo"
						value={logo}
						disabled={!canEdit}
						onUploaded={({ url }) => setLogo(url)}
						onRemoved={() => setLogo(null)}
					/>
				</div>
			</div>
		</section>
	);
}

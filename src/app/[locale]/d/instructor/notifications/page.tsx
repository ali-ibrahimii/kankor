import { getTranslations, setRequestLocale } from "next-intl/server";
import { NotificationsCatalog } from "@/components/blocks/notifications";
import { getCurrentUser } from "@/lib/auth/session";
import { BaseParams } from "@/types/common.types";

export default async function InstructorNotificationsPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const [t, user] = await Promise.all([
		getTranslations("notifications"),
		getCurrentUser(),
	]);

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			<NotificationsCatalog telegramLinked={!!user?.telegram_chat_id} />
		</div>
	);
}

import { setRequestLocale } from "next-intl/server";
import { LogoBlueRounded } from "@/components/logos/logos";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { BaseParams } from "@/types/common.types";

export default async function Layout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-4xl">
				<div className="flex flex-col gap-6">
					<div className="flex flex-row items-center justify-between">
						<Link
							href={routes.home.page(undefined, { locale })}
							aria-label="Kankor"
							className="inline-flex items-center transition-opacity hover:opacity-85"
						>
							<LogoBlueRounded className="size-10" />
						</Link>
						<LocaleSwitcher />
					</div>
					{children}
				</div>
			</div>
		</div>
	);
}

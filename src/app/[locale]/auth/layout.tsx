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
		<div className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,.11),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(183,244,134,.12),transparent_38%),linear-gradient(135deg,#f7f8fc,#eef2ff_55%,#f8fafc)] px-4 py-5 sm:px-7 sm:py-8 dark:bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,.15),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(183,244,134,.08),transparent_38%),linear-gradient(135deg,#111827,#151a2c_55%,#101827)]">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -top-40 start-1/3 size-[28rem] rounded-full bg-primary/5 blur-3xl"
			/>
			<div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col">
				<header className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/75 px-3 py-2.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 sm:mb-6 sm:px-4">
					<Link
						href={routes.home.page(undefined, { locale })}
						aria-label="Kankor"
						className="inline-flex min-w-0 items-center gap-2.5 rounded-xl transition-opacity hover:opacity-85"
					>
						<LogoBlueRounded className="size-9 shrink-0 sm:size-10" />
						<span className="truncate text-sm font-extrabold tracking-tight text-foreground sm:text-base">
							Abzar Kankor
						</span>
					</Link>
					<LocaleSwitcher />
				</header>
				{children}
			</div>
		</div>
	);
}

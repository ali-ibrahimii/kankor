"use client";

import { useLocale } from "next-intl";
import * as React from "react";

/** Live local time and a locale-aware date for the dashboard top bar. */
export function DashboardClock() {
	const locale = useLocale();
	const [now, setNow] = React.useState<Date | null>(null);

	React.useEffect(() => {
		const update = () => setNow(new Date());
		update();
		const timer = window.setInterval(update, 1000);
		return () => window.clearInterval(timer);
	}, []);

	const dateLocale = locale === "fa" ? "fa-IR-u-ca-persian" : locale;
	const timeLocale = locale === "fa" ? "fa-IR" : locale;
	const date = now
		? new Intl.DateTimeFormat(dateLocale, {
				weekday: "short",
				day: "numeric",
				month: "short",
			}).format(now)
		: "\u00a0";
	const time = now
		? new Intl.DateTimeFormat(timeLocale, {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false,
			}).format(now)
		: "\u00a0";

	return (
		<time
			dir="auto"
			className="inline-flex shrink-0 flex-col items-center justify-center px-2 text-[10px] leading-tight text-muted-foreground tabular-nums sm:flex-row sm:gap-2 sm:text-xs"
			aria-label={now ? `${date} ${time}` : undefined}
		>
			<span>{date}</span>
			<span className="font-semibold text-foreground">{time}</span>
		</time>
	);
}

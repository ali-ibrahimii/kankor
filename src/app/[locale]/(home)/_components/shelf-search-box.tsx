"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

/**
 * EduLe-style rounded search pill with the green magnifier button,
 * shown on the home "All Courses" shelf header. Navigates to the
 * global search page.
 */
export function ShelfSearchBox({
	placeholder,
	searchLabel,
}: {
	placeholder: string;
	searchLabel: string;
}) {
	const router = useRouter();
	const [value, setValue] = useState("");

	return (
		<form
			role="search"
			className="relative w-full max-w-[360px]"
			onSubmit={(event) => {
				event.preventDefault();
				const trimmed = value.trim();
				if (!trimmed) {
					return;
				}
				router.push(routes.search.page({ q: trimmed }));
			}}
		>
			<input
				type="search"
				value={value}
				onChange={(event) => setValue(event.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
				className="min-h-11 w-full rounded-2xl border border-emerald-700/15 bg-white py-2.5 pe-12 ps-4 text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-edule-green/50 focus:ring-4 focus:ring-edule-green/10 dark:border-white/10 dark:bg-white/5"
			/>

			<button
				type="submit"
				aria-label={searchLabel}
				className="absolute end-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-xl bg-edule-green text-white shadow-sm transition hover:bg-edule-green/90"
			>
				<Search className="size-4" />
			</button>
		</form>
	);
}

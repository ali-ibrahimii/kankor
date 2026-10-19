"use client";

import { Command as CommandPrimitive } from "cmdk";
import {
	BookOpen,
	ClipboardList,
	GraduationCap,
	Layers,
	Loader2,
	Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import type { SearchResultType } from "@/components/blocks/search/build-result-href";
import { buildResultHref } from "@/components/blocks/search/build-result-href";
import {
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import { useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const GROUP_ICON: Record<
	SearchResultType,
	React.ComponentType<{ className?: string }>
> = {
	course: GraduationCap,
	library: BookOpen,
	deck: Layers,
	quiz: ClipboardList,
};

const GROUP_ORDER: SearchResultType[] = ["course", "library", "deck", "quiz"];

const GROUP_LABEL_KEY: Record<
	SearchResultType,
	"courses" | "libraries" | "decks" | "quizzes"
> = {
	course: "courses",
	library: "libraries",
	deck: "decks",
	quiz: "quizzes",
};

const MIN_QUERY_LENGTH = 2;

export function GlobalSearch({
	classes,
}: {
	classes?: {
		container?: string;
	};
}) {
	const t = useTranslations("search");
	const locale = useLocale();
	const router = useRouter();
	const containerRef = React.useRef<HTMLDivElement>(null);

	const [query, setQuery] = React.useState("");
	const [open, setOpen] = React.useState(false);

	const { data: suggestions = [], isFetching } = useSearchSuggestions(query);

	const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH;

	React.useEffect(() => {
		function handlePointerDown(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		}

		document.addEventListener("mousedown", handlePointerDown);
		return () => document.removeEventListener("mousedown", handlePointerDown);
	}, []);

	function goToResults(rawQuery: string) {
		const trimmed = rawQuery.trim();
		if (!trimmed) return;
		setOpen(false);
		router.push(routes.search.page({ q: trimmed }));
	}

	function goToItem(resultType: SearchResultType, slug: string) {
		setOpen(false);
		router.push(buildResultHref(resultType, slug));
	}

	const groups = React.useMemo(
		() =>
			GROUP_ORDER.map((type) => ({
				type,
				label: t(`groups.${GROUP_LABEL_KEY[type]}`),
				items: suggestions.filter((s) => s.result_type === type),
			})).filter((group) => group.items.length > 0),
		[suggestions, t]
	);

	return (
		<div ref={containerRef} className={cn("relative", classes?.container)}>
			<CommandPrimitive
				shouldFilter={false}
				loop
				className="overflow-visible bg-transparent"
			>
				<InputGroup className="bg-white/70">
					<CommandPrimitive.Input
						data-slot="input-group-control"
						value={query}
						onValueChange={(value) => {
							setQuery(value);
							setOpen(true);
						}}
						onFocus={() => setOpen(true)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								event.stopPropagation();
								goToResults(query);
							}
							if (event.key === "Escape") {
								setOpen(false);
							}
						}}
						placeholder={
							locale === "fa" || locale === "ps" ? "جستجو" : "Search..."
						}
						className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2.5 text-sm outline-hidden placeholder:text-slate-400"
					/>
					<InputGroupAddon>
						<Search className="size-4 text-slate-400" />
					</InputGroupAddon>
				</InputGroup>

				{showDropdown && (
					<div className="absolute inset-x-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-md border border-slate-100 bg-white shadow-lg">
						<CommandList>
							{isFetching && suggestions.length === 0 ? (
								<div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
									<Loader2 className="size-4 animate-spin" />
									{t("searching")}
								</div>
							) : groups.length === 0 ? (
								<CommandEmpty>{t("noResults")}</CommandEmpty>
							) : (
								groups.map(({ type, label, items }) => {
									const Icon = GROUP_ICON[type];
									return (
										<CommandGroup key={type} heading={label}>
											{items.map((item) => (
												<CommandItem
													key={`${type}-${item.id}`}
													value={`${type}-${item.id}`}
													onSelect={() => goToItem(type, item.slug)}
												>
													<Icon className="size-4 shrink-0 text-slate-400" />
													<div className="min-w-0 flex-1">
														<p className="truncate">{item.title}</p>
														{item.subtitle && (
															<p className="truncate text-xs text-muted-foreground">
																{item.subtitle}
															</p>
														)}
													</div>
												</CommandItem>
											))}
										</CommandGroup>
									);
								})
							)}
						</CommandList>
						<div className="border-t border-slate-100 p-2">
							<button
								type="button"
								className="w-full rounded-lg px-2 py-1.5 text-start text-xs font-medium text-[#1461B8] hover:bg-slate-50"
								onClick={() => goToResults(query)}
							>
								{t("viewAllResults", { query: query.trim() })}
							</button>
						</div>
					</div>
				)}
			</CommandPrimitive>
		</div>
	);
}

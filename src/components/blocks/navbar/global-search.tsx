"use client";

import { Command as CommandPrimitive } from "cmdk";
import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	ClipboardList,
	GraduationCap,
	Layers,
	Loader2,
	Search,
	X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import type { SearchResultType } from "@/components/blocks/search/build-result-href";
import { buildResultHref } from "@/components/blocks/search/build-result-href";
import { Button } from "@/components/ui/button";
import {
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import { useRouter } from "@/i18n/navigation";
import { isRtl } from "@/i18n/routing";
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
	const rtl = isRtl(locale);
	const Arrow = rtl ? ArrowLeft : ArrowRight;
	const router = useRouter();
	const containerRef = React.useRef<HTMLDivElement>(null);

	const [query, setQuery] = React.useState("");
	const [open, setOpen] = React.useState(false);
	const [mobileDialogOpen, setMobileDialogOpen] = React.useState(false);

	const { data: suggestions = [], isFetching } = useSearchSuggestions(query);

	const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;
	const showDesktopDropdown = open && hasQuery;
	const placeholderText = t("placeholder");

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
		setMobileDialogOpen(false);
		router.push(routes.search.page({ q: trimmed }));
	}

	function goToItem(resultType: SearchResultType, slug: string) {
		setOpen(false);
		setMobileDialogOpen(false);
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

	const suggestionListContent = (
		<>
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
										<Icon className="size-4 shrink-0 text-muted-foreground" />
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium">{item.title}</p>
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
			<div className="border-t border-border/70 p-2">
				<button
					type="button"
					className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-xs font-bold text-primary transition hover:bg-primary/5"
					onClick={() => goToResults(query)}
				>
					<span>{t("viewAllResults", { query: query.trim() })}</span>
					<Arrow className="size-3.5 shrink-0" />
				</button>
			</div>
		</>
	);

	return (
		<>
			{/* Mobile: compact Search button that opens a full responsive search dialog */}
			<Button
				type="button"
				variant="ghost"
				size="icon"
				data-testid="mobile-search-trigger"
				aria-label={t("openSearch")}
				title={t("openSearch")}
				onClick={() => setMobileDialogOpen(true)}
				className="size-9 shrink-0 rounded-xl text-slate-600 hover:bg-violet-50 hover:text-violet-700 md:hidden dark:text-slate-200 dark:hover:bg-white/10"
			>
				<Search className="size-4" />
			</Button>

			<Dialog open={mobileDialogOpen} onOpenChange={setMobileDialogOpen}>
				<DialogContent
					data-testid="mobile-search-dialog"
					className="top-[12%] translate-y-0 gap-3 rounded-3xl border-border/80 bg-popover p-4 sm:max-w-lg"
				>
					<DialogHeader className="text-start">
						<DialogTitle className="text-sm font-extrabold">
							{t("openSearch")}
						</DialogTitle>
					</DialogHeader>

					<CommandPrimitive
						shouldFilter={false}
						loop
						className="overflow-visible bg-transparent"
					>
						<form
							onSubmit={(event) => {
								event.preventDefault();
								goToResults(query);
							}}
							className="flex items-center gap-2"
						>
							<InputGroup className="flex-1 rounded-xl border-border bg-muted/40">
								<CommandPrimitive.Input
									autoFocus
									value={query}
									onValueChange={setQuery}
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											event.stopPropagation();
											goToResults(query);
										}
									}}
									placeholder={placeholderText}
									className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-hidden placeholder:text-muted-foreground"
								/>
								{query ? (
									<InputGroupAddon>
										<button
											type="button"
											onClick={() => setQuery("")}
											aria-label={t("clearSearch")}
											className="rounded-md p-1 text-muted-foreground hover:text-foreground"
										>
											<X className="size-3.5" />
										</button>
									</InputGroupAddon>
								) : (
									<InputGroupAddon>
										<Search className="size-4 text-muted-foreground" />
									</InputGroupAddon>
								)}
							</InputGroup>

							<Button
								type="submit"
								size="sm"
								disabled={!query.trim()}
								className="h-10 shrink-0 rounded-xl px-4 text-xs font-bold"
							>
								{t("submitSearch")}
							</Button>
						</form>

						{hasQuery && (
							<div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-background">
								{suggestionListContent}
							</div>
						)}
					</CommandPrimitive>
				</DialogContent>
			</Dialog>

			{/* Desktop: inline search input with instant dropdown */}
			<div
				ref={containerRef}
				className={cn(
					"relative hidden w-48 xl:w-64 md:block",
					classes?.container
				)}
			>
				<CommandPrimitive
					shouldFilter={false}
					loop
					className="overflow-visible bg-transparent"
				>
					<InputGroup className="rounded-xl bg-background/80 dark:bg-white/[.06]">
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
							placeholder={placeholderText}
							className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2.5 text-sm outline-hidden placeholder:text-muted-foreground"
						/>
						<InputGroupAddon>
							<Search className="size-4 text-muted-foreground" />
						</InputGroupAddon>
					</InputGroup>

					{showDesktopDropdown && (
						<div className="absolute end-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-xl">
							{suggestionListContent}
						</div>
					)}
				</CommandPrimitive>
			</div>
		</>
	);
}

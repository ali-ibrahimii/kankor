import { BookOpen, ClipboardList, GraduationCap, Layers } from "lucide-react";
import type { SearchSuggestion } from "@/hooks/use-search-suggestions";
import { Link } from "@/i18n/navigation";
import { buildResultHref } from "./build-result-href";

const ICON = {
	course: GraduationCap,
	library: BookOpen,
	deck: Layers,
	quiz: ClipboardList,
} as const;

export function SearchResultRow({
	suggestion,
}: {
	suggestion: SearchSuggestion;
}) {
	const Icon = ICON[suggestion.result_type];

	return (
		<Link
			href={buildResultHref(suggestion.result_type, suggestion.slug)}
			className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
		>
			<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<Icon className="size-4" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-slate-900">
					{suggestion.title}
				</p>
				{suggestion.subtitle && (
					<p className="truncate text-xs text-muted-foreground">
						{suggestion.subtitle}
					</p>
				)}
			</div>
		</Link>
	);
}

"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { UseQueryFilters } from "@/hooks/filter/filter.hooks";
import type { Filter } from "@/hooks/filter/types";
import { cn } from "@/lib/utils";
import type { ColumnName } from "@/types/db.types";
import { useCourseFilterOptions } from "./use-course-filter-options";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CourseFilterOptions = {
	showPublished?: boolean;
	showLevel?: boolean;
	showLanguage?: boolean;
	showSubject?: boolean;
	showGrade?: boolean;
	showBook?: boolean;
	/** Filter by instructor — meaningful only on admin listings that span all instructors. */
	showInstructor?: boolean;
	/** Filter by free vs. paid — meaningful on listings students browse to enroll in. */
	showPricing?: boolean;
};

export type CourseFiltersProps = {
	queryState: Pick<
		UseQueryFilters<"courses">,
		"state" | "setSearch" | "setState"
	>;
	options?: CourseFilterOptions;
	className?: string;
};

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({
	label,
	onRemove,
}: {
	label: string;
	onRemove: () => void;
}) {
	return (
		<Badge variant="secondary" className="gap-1 rounded-full pe-1 font-normal">
			{label}
			<button
				onClick={onRemove}
				className="ms-0.5 rounded-full p-0.5 hover:bg-foreground/10"
				aria-label={`Remove ${label} filter`}
			>
				<X className="size-2.5" />
			</button>
		</Badge>
	);
}

// ─── FilterToggleGroup ────────────────────────────────────────────────────────

function FilterToggleGroup<T extends string | boolean>({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: readonly { value: T; label: string }[];
	value: T | null;
	onChange: (v: T | null) => void;
}) {
	return (
		<div className="space-y-2">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<div className="flex flex-wrap gap-1.5">
				{options.map((opt) => (
					<button
						key={String(opt.value)}
						onClick={() => onChange(value === opt.value ? null : opt.value)}
						className={cn(
							"rounded-full border px-3 py-1 text-xs transition-colors",
							value === opt.value
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-background hover:bg-muted"
						)}
					>
						{opt.label}
					</button>
				))}
			</div>
		</div>
	);
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────

const ALL_VALUE = "__all__";

function FilterSelect({
	label,
	allLabel,
	options,
	value,
	onChange,
}: {
	label: string;
	allLabel: string;
	options: readonly { value: string; label: string }[];
	value: string | null;
	onChange: (v: string | null) => void;
}) {
	return (
		<div className="space-y-2">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<Select
				value={value ?? ALL_VALUE}
				onValueChange={(v) => onChange(v === ALL_VALUE ? null : v)}
			>
				<SelectTrigger size="sm" className="w-full" aria-label={label}>
					<SelectValue placeholder={allLabel} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
					{options.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

// ─── CourseFilters ─────────────────────────────────────────────────────────────

export function CourseFilters({
	queryState,
	options = { showLevel: true, showLanguage: true },
	className,
}: CourseFiltersProps) {
	const t = useTranslations("courses");
	const { state, setSearch, setState } = queryState;
	const [searchValue, setSearchValue] = React.useState(state.search ?? "");
	const [isOpen, setIsOpen] = React.useState(false);

	React.useEffect(() => {
		setSearchValue(state.search ?? "");
	}, [state.search]);

	function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
		setSearchValue(e.target.value);
		setSearch(e.target.value);
	}

	function handleSearchClear() {
		setSearchValue("");
		setSearch("");
	}

	const referenceOptions = useCourseFilterOptions({
		subjects: options.showSubject,
		grades: options.showGrade,
		books: options.showBook,
		instructors: options.showInstructor,
	});

	const currentLevel =
		(state.filters?.find((f) => f.field === "level")?.value as string) ?? null;
	const currentLanguage =
		(state.filters?.find((f) => f.field === "language")?.value as string) ??
		null;
	const currentPublished =
		(state.filters?.find((f) => f.field === "is_published")?.value as
			| boolean
			| undefined) ?? null;
	const currentSubjectId =
		(state.filters?.find((f) => f.field === "subject_id")?.value as string) ??
		null;
	const currentGradeId =
		(state.filters?.find((f) => f.field === "grade_id")?.value as string) ??
		null;
	const currentBookId =
		(state.filters?.find((f) => f.field === "book_id")?.value as string) ??
		null;
	const currentInstructorId =
		(state.filters?.find((f) => f.field === "instructor_id")?.value as
			| string
			| undefined) ?? null;
	const currentIsFree =
		(state.filters?.find((f) => f.field === "is_free")?.value as
			| boolean
			| undefined) ?? null;

	/**
	 * Apply set/remove filter changes in ONE state update. Multiple synchronous
	 * nuqs setState calls in the same handler clobber each other (last write
	 * wins), so every multi-field change must go through a single call.
	 */
	function applyFilterChanges(changes: {
		set?: Filter<"courses">[];
		remove?: ColumnName<"courses">[];
	}) {
		setState((prev) => {
			const touched = new Set<string>([
				...(changes.remove ?? []).map(String),
				...(changes.set ?? []).map((f) => String(f.field)),
			]);
			return {
				...prev,
				filters: [
					...(prev.filters ?? []).filter((f) => !touched.has(String(f.field))),
					...(changes.set ?? []),
				],
				pagination: prev.pagination
					? { ...prev.pagination, page: 1 }
					: prev.pagination,
			};
		});
	}

	function setLevelFilter(v: string | null) {
		applyFilterChanges(
			v
				? { set: [{ field: "level", operator: "eq", value: v as any }] }
				: { remove: ["level"] }
		);
	}

	function setLanguageFilter(v: string | null) {
		applyFilterChanges(
			v
				? { set: [{ field: "language", operator: "eq", value: v as any }] }
				: { remove: ["language"] }
		);
	}

	function setPublishedFilter(v: boolean | null) {
		applyFilterChanges(
			v !== null
				? { set: [{ field: "is_published", operator: "eq", value: v as any }] }
				: { remove: ["is_published"] }
		);
	}

	// Book options narrow to the selected subject/grade
	const visibleBooks = React.useMemo(
		() =>
			referenceOptions.books.filter(
				(book) =>
					(!currentSubjectId || book.subject_id === currentSubjectId) &&
					(!currentGradeId || book.grade_id === currentGradeId)
			),
		[referenceOptions.books, currentSubjectId, currentGradeId]
	);

	/** Selected book no longer matching the new subject/grade must be dropped. */
	function isBookMismatched(subjectId: string | null, gradeId: string | null) {
		if (!currentBookId) return false;
		const book = referenceOptions.books.find((b) => b.id === currentBookId);
		return (
			!book ||
			(!!subjectId && book.subject_id !== subjectId) ||
			(!!gradeId && book.grade_id !== gradeId)
		);
	}

	function setSubjectFilter(v: string | null) {
		applyFilterChanges({
			set: v ? [{ field: "subject_id", operator: "eq", value: v as any }] : [],
			remove: [
				...(v ? [] : (["subject_id"] as const)),
				...(isBookMismatched(v, currentGradeId) ? (["book_id"] as const) : []),
			],
		});
	}

	function setGradeFilter(v: string | null) {
		applyFilterChanges({
			set: v ? [{ field: "grade_id", operator: "eq", value: v as any }] : [],
			remove: [
				...(v ? [] : (["grade_id"] as const)),
				...(isBookMismatched(currentSubjectId, v)
					? (["book_id"] as const)
					: []),
			],
		});
	}

	function setBookFilter(v: string | null) {
		applyFilterChanges(
			v
				? { set: [{ field: "book_id", operator: "eq", value: v as any }] }
				: { remove: ["book_id"] }
		);
	}

	function setPricingFilter(v: boolean | null) {
		applyFilterChanges(
			v !== null
				? { set: [{ field: "is_free", operator: "eq", value: v as any }] }
				: { remove: ["is_free"] }
		);
	}

	function setInstructorFilter(v: string | null) {
		applyFilterChanges(
			v
				? {
						set: [{ field: "instructor_id", operator: "eq", value: v as any }],
					}
				: { remove: ["instructor_id"] }
		);
	}

	function clearAllFilters() {
		applyFilterChanges({
			remove: [
				"level",
				"language",
				"is_published",
				"subject_id",
				"grade_id",
				"book_id",
				"instructor_id",
				"is_free",
			],
		});
	}

	const levelOptions = [
		{ value: "beginner", label: t("level_beginner") },
		{ value: "intermediate", label: t("level_intermediate") },
		{ value: "advanced", label: t("level_advanced") },
		{ value: "all_levels", label: t("level_all_levels") },
	] as const;

	const languageOptions = [
		{ value: "fa", label: t("language_fa") },
		{ value: "ps", label: t("language_ps") },
		{ value: "en", label: t("language_en") },
	] as const;

	const publishedOptions = [
		{ value: true, label: t("status_published") },
		{ value: false, label: t("status_draft") },
	] as const;

	const pricingOptions = [
		{ value: true, label: t("free") },
		{ value: false, label: t("pricing_paid") },
	] as const;

	const subjectOptions = referenceOptions.subjects.map((s) => ({
		value: s.id,
		label: s.name,
	}));
	const gradeOptions = referenceOptions.grades.map((g) => ({
		value: g.id,
		label: g.name,
	}));
	const bookOptions = visibleBooks.map((b) => ({
		value: b.id,
		label: b.name,
	}));
	const instructorOptions = referenceOptions.instructors.map((i) => ({
		value: i.id,
		label: i.name,
	}));

	const activeFilterCount =
		(currentLevel ? 1 : 0) +
		(currentLanguage ? 1 : 0) +
		(currentPublished !== null ? 1 : 0) +
		(currentSubjectId ? 1 : 0) +
		(currentGradeId ? 1 : 0) +
		(currentBookId ? 1 : 0) +
		(currentInstructorId ? 1 : 0) +
		(currentIsFree !== null ? 1 : 0);

	const activeChips: { label: string; onRemove: () => void }[] = [
		...(currentLevel
			? [
					{
						label:
							levelOptions.find((o) => o.value === currentLevel)?.label ??
							currentLevel,
						onRemove: () => setLevelFilter(null),
					},
				]
			: []),
		...(currentLanguage
			? [
					{
						label:
							languageOptions.find((o) => o.value === currentLanguage)?.label ??
							currentLanguage,
						onRemove: () => setLanguageFilter(null),
					},
				]
			: []),
		...(currentPublished !== null
			? [
					{
						label: currentPublished ? t("status_published") : t("status_draft"),
						onRemove: () => setPublishedFilter(null),
					},
				]
			: []),
		...(currentSubjectId
			? [
					{
						label:
							subjectOptions.find((o) => o.value === currentSubjectId)?.label ??
							t("filters_subject"),
						onRemove: () => setSubjectFilter(null),
					},
				]
			: []),
		...(currentGradeId
			? [
					{
						label:
							gradeOptions.find((o) => o.value === currentGradeId)?.label ??
							t("filters_grade"),
						onRemove: () => setGradeFilter(null),
					},
				]
			: []),
		...(currentBookId
			? [
					{
						label:
							referenceOptions.books.find((b) => b.id === currentBookId)
								?.name ?? t("filters_book"),
						onRemove: () => setBookFilter(null),
					},
				]
			: []),
		...(currentInstructorId
			? [
					{
						label:
							instructorOptions.find((o) => o.value === currentInstructorId)
								?.label ?? t("filters_instructor"),
						onRemove: () => setInstructorFilter(null),
					},
				]
			: []),
		...(currentIsFree !== null
			? [
					{
						label: currentIsFree ? t("free") : t("pricing_paid"),
						onRemove: () => setPricingFilter(null),
					},
				]
			: []),
	];

	return (
		<div className={cn("space-y-3", className)}>
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute inset-s-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={searchValue}
						onChange={handleSearchChange}
						placeholder={t("searchPlaceholder")}
						className="h-9 pe-9 ps-9"
					/>
					{searchValue && (
						<button
							onClick={handleSearchClear}
							className="absolute inset-e-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"
							aria-label="Clear search"
						>
							<X className="size-3.5" />
						</button>
					)}
				</div>

				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="relative h-9 shrink-0 gap-1.5"
						>
							<SlidersHorizontal className="size-3.5" />
							<span className="hidden sm:inline">{t("filters")}</span>
							{activeFilterCount > 0 && (
								<span className="absolute -inset-e-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
									{activeFilterCount}
								</span>
							)}
						</Button>
					</PopoverTrigger>

					<PopoverContent
						align="end"
						className="max-h-[min(var(--radix-popover-content-available-height),40rem)] w-72 space-y-4 overflow-y-auto p-4"
					>
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium">{t("filters")}</p>
							{activeFilterCount > 0 && (
								<Button
									variant="ghost"
									size="sm"
									className="h-auto px-2 py-0.5 text-xs"
									onClick={clearAllFilters}
								>
									{t("clearAll")}
								</Button>
							)}
						</div>

						{options.showLevel && (
							<>
								<Separator />
								<FilterToggleGroup
									label={t("filters_level")}
									options={levelOptions}
									value={currentLevel as any}
									onChange={setLevelFilter}
								/>
							</>
						)}

						{options.showLanguage && (
							<>
								<Separator />
								<FilterToggleGroup
									label={t("filters_language")}
									options={languageOptions}
									value={currentLanguage as any}
									onChange={setLanguageFilter}
								/>
							</>
						)}

						{options.showPublished && (
							<>
								<Separator />
								<FilterToggleGroup
									label={t("filters_status")}
									options={publishedOptions}
									value={currentPublished as any}
									onChange={setPublishedFilter}
								/>
							</>
						)}

						{options.showPricing && (
							<>
								<Separator />
								<FilterToggleGroup
									label={t("filters_pricing")}
									options={pricingOptions}
									value={currentIsFree as any}
									onChange={setPricingFilter}
								/>
							</>
						)}

						{options.showSubject && (
							<>
								<Separator />
								<FilterSelect
									label={t("filters_subject")}
									allLabel={t("filterAll")}
									options={subjectOptions}
									value={currentSubjectId}
									onChange={setSubjectFilter}
								/>
							</>
						)}

						{options.showGrade && (
							<>
								<Separator />
								<FilterSelect
									label={t("filters_grade")}
									allLabel={t("filterAll")}
									options={gradeOptions}
									value={currentGradeId}
									onChange={setGradeFilter}
								/>
							</>
						)}

						{options.showBook && (
							<>
								<Separator />
								<FilterSelect
									label={t("filters_book")}
									allLabel={t("filterAll")}
									options={bookOptions}
									value={currentBookId}
									onChange={setBookFilter}
								/>
							</>
						)}

						{options.showInstructor && (
							<>
								<Separator />
								<FilterSelect
									label={t("filters_instructor")}
									allLabel={t("filterAll")}
									options={instructorOptions}
									value={currentInstructorId}
									onChange={setInstructorFilter}
								/>
							</>
						)}
					</PopoverContent>
				</Popover>
			</div>

			{activeChips.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{activeChips.map((chip) => (
						<FilterChip
							key={chip.label}
							label={chip.label}
							onRemove={chip.onRemove}
						/>
					))}
				</div>
			)}
		</div>
	);
}

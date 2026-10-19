"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { LoaderIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export interface RelatedResourcesSelectorProps {
	resourceType: "courses" | "decks" | "quizzes" | "libraries";
	selectedIds: string[];
	onChange: (ids: string[]) => void;
	label: string;
	placeholder?: string;
}

export function RelatedResourcesSelector({
	resourceType,
	selectedIds,
	onChange,
	label,
	placeholder,
}: RelatedResourcesSelectorProps) {
	const t = useTranslations("seo");
	const [open, setOpen] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const client = createClient();

	interface OptionItem {
		id: string;
		label: string;
	}

	const limit = 20;

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery<OptionItem[]>({
			queryKey: ["related-resources-options", resourceType, debouncedSearch],
			queryFn: async ({ pageParam = 0 }) => {
				const from = (pageParam as number) * limit;
				const to = from + limit - 1;

				let query: any = client.from(resourceType);
				if (resourceType === "courses") {
					query = query.select("id, title").eq("is_published", true);
				} else if (resourceType === "decks") {
					query = query.select("id, name").eq("visibility", "public");
				} else if (resourceType === "quizzes") {
					query = query.select("id, title").eq("visibility", "public");
				} else if (resourceType === "libraries") {
					query = query.select("id, title");
				}

				if (debouncedSearch.trim()) {
					const searchVal = `%${debouncedSearch.trim().toLowerCase()}%`;
					if (resourceType === "decks") {
						query = query.ilike("name", searchVal);
					} else {
						query = query.ilike("title", searchVal);
					}
				}

				const { data, error } = await query
					.order(resourceType === "decks" ? "name" : "title")
					.range(from, to);

				if (error) throw error;

				return (data || []).map((item: any) => ({
					id: item.id,
					label: item.title || item.name || "",
				}));
			},
			initialPageParam: 0,
			getNextPageParam: (lastPage, allPages) => {
				if (lastPage.length < limit) return undefined;
				return allPages.length;
			},
			enabled: open,
			staleTime: 60 * 1000,
		});

	const options = React.useMemo(() => {
		return data?.pages.flat() ?? [];
	}, [data]);

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const target = e.currentTarget;
		if (
			target.scrollHeight - target.scrollTop <= target.clientHeight + 50 &&
			hasNextPage &&
			!isFetchingNextPage
		) {
			fetchNextPage();
		}
	};

	const toggleItem = (id: string, checked: boolean) => {
		if (checked) {
			onChange([...selectedIds, id]);
		} else {
			onChange(selectedIds.filter((x) => x !== id));
		}
	};

	return (
		<div className="space-y-1.5">
			<Label className="text-sm font-medium">{label}</Label>
			<div>
				<Button
					type="button"
					variant="outline"
					onClick={() => setOpen(true)}
					className="w-full justify-start text-left font-normal"
				>
					{placeholder || label} ({selectedIds.length}{" "}
					{t("relatedResources") ? "selected" : "selected"})
				</Button>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md p-6">
					<DialogHeader className="pb-2">
						<DialogTitle>{label}</DialogTitle>
						<DialogDescription>
							Select related items to associate with this resource.
						</DialogDescription>
					</DialogHeader>

					<div className="flex min-h-0 flex-1 flex-col space-y-4">
						<div className="relative">
							<SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9"
							/>
						</div>

						<div
							onScroll={handleScroll}
							className="max-h-[350px] overflow-y-auto border rounded-md p-2"
						>
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<LoaderIcon className="size-5 animate-spin text-muted-foreground" />
								</div>
							) : options.length === 0 ? (
								<div className="py-8 text-center text-sm text-muted-foreground">
									No items found
								</div>
							) : (
								<div className="space-y-1">
									{options.map((opt: OptionItem) => {
										const isChecked = selectedIds.includes(opt.id);
										return (
											<div
												key={opt.id}
												className="flex items-center space-x-2 rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
											>
												<Checkbox
													id={`rel-${opt.id}`}
													checked={isChecked}
													onCheckedChange={(checked) =>
														toggleItem(opt.id, !!checked)
													}
												/>
												<label
													htmlFor={`rel-${opt.id}`}
													className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
												>
													{opt.label}
												</label>
											</div>
										);
									})}
									{isFetchingNextPage && (
										<div className="flex items-center justify-center py-2">
											<LoaderIcon className="size-4 animate-spin text-muted-foreground" />
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					<DialogFooter className="pt-4 border-t mt-4 shrink-0">
						<Button type="button" onClick={() => setOpen(false)}>
							Done
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

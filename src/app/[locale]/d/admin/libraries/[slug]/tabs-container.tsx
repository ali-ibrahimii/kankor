"use client";

import { LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	LibraryForm,
	type LibraryFormValues,
} from "@/components/blocks/libraries/library-form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import type { LibraryDetail } from "@/types/queries.types";

interface AdminLibraryTabsProps {
	book: LibraryDetail;
	previewElement: React.ReactNode;
}

export function AdminLibraryTabs({
	book,
	previewElement,
}: AdminLibraryTabsProps) {
	const t = useTranslations("libraries");
	const router = useRouter();
	const supabase = createClient();
	const [activeTab, setActiveTab] = React.useState<string>("preview");

	const [relatedCourses, setRelatedCourses] = React.useState<string[]>([]);
	const [relatedDecks, setRelatedDecks] = React.useState<string[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);

	React.useEffect(() => {
		async function load() {
			const { data } = await supabase
				.from("libraries")
				.select("related_courses_ids, related_decks_ids")
				.eq("id", book.id)
				.single();
			if (data) {
				setRelatedCourses(data.related_courses_ids || []);
				setRelatedDecks(data.related_decks_ids || []);
			}
			setIsLoading(false);
		}
		load();
	}, [book.id, supabase]);

	const initialValues: LibraryFormValues = {
		title: book.title,
		desc: book.desc ?? "",
		file_path: book.file_path,
		uri: book.uri,
		slug: book.slug ?? "",
		book_id: (book.book as any)?.id ?? "",
		category_id: (book.category as any)?.id ?? "",
		grade_id: (book.grade as any)?.id ?? "",
		subject_id: (book.subject as any)?.id ?? "",
		seo_title: book.seo_title ?? "",
		seo_description: book.seo_description ?? "",
		related_courses_ids: relatedCourses,
		related_decks_ids: relatedDecks,
	};

	const handleEditSubmit = async (values: LibraryFormValues) => {
		try {
			const { error } = await supabase
				.from("libraries")
				.update({
					title: values.title,
					desc: values.desc || null,
					file_path: values.file_path,
					uri: values.uri,
					slug: values.slug || null,
					book_id: values.book_id || null,
					category_id: values.category_id || null,
					grade_id: values.grade_id || null,
					subject_id: values.subject_id || null,
					seo_title: values.seo_title || null,
					seo_description: values.seo_description || null,
					related_courses_ids: values.related_courses_ids || [],
					related_decks_ids: values.related_decks_ids || [],
				})
				.eq("id", book.id);

			if (error) throw error;

			toast.success(t("admin.saveSuccess"));
			router.refresh();
			setActiveTab("preview");
		} catch (error: any) {
			toast.error(error.message || "Failed to save");
		}
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<div className="flex items-center justify-between border-b pb-3 mb-6">
					<div>
						<h1 className="text-xl font-bold tracking-tight text-foreground">
							{book.title}
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Manage and preview this library resource.
						</p>
					</div>
					<TabsList>
						<TabsTrigger value="preview" className="cursor-pointer">
							{t("admin.tabs.preview")}
						</TabsTrigger>
						<TabsTrigger value="edit" className="cursor-pointer">
							{t("admin.tabs.edit")}
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent
					value="preview"
					className="focus-visible:outline-none focus-visible:ring-0"
				>
					{previewElement}
				</TabsContent>

				<TabsContent
					value="edit"
					className="focus-visible:outline-none focus-visible:ring-0"
				>
					<Card className="bg-card border shadow-sm">
						<CardContent className="p-6">
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<LoaderIcon className="size-5 animate-spin text-muted-foreground" />
								</div>
							) : (
								<LibraryForm
									initialValues={initialValues}
									onSubmit={handleEditSubmit}
									onCancel={() => setActiveTab("preview")}
									submitLabel="Save Changes"
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

import {
	ArrowLeft,
	BookOpen,
	Download,
	FileText,
	GraduationCap,
	Tag,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BookmarkButton } from "@/components/blocks/bookmarks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { LibraryDetail } from "@/types/queries.types";

export type LibraryDetailViewProps = {
	book: LibraryDetail;
	backHref: string;
	backLabel: string;
};

/** Shared library book detail view — rendered by both the public
 * /libraries/[slug] page and the student dashboard /d/library/[slug] page. */
export async function LibraryDetailView({
	book,
	backHref,
	backLabel,
}: LibraryDetailViewProps) {
	const t = await getTranslations("libraries");

	return (
		<div className="container mx-auto flex flex-col gap-6">
			{/* Back Navigation */}
			<div className="flex items-center justify-between gap-2">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="gap-2 text-muted-foreground hover:text-foreground"
				>
					<Link href={backHref}>
						<ArrowLeft className="size-4 rtl:rotate-180" />
						{backLabel}
					</Link>
				</Button>
				<BookmarkButton itemType="library" itemId={book.id} />
			</div>

			{/* Main Grid */}
			<div className=" relative grid grid-cols-1 lg:grid-cols-3 gap-8 items- pb-12">
				{/* Left Column: PDF Viewer */}
				<div className="lg:col-span-2 flex flex-col gap-4">
					<Card className="overflow-hidden border-slate-200/80 shadow-md bg-white">
						<CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700">
								<FileText className="size-4 text-[#1461B8]" />
								{t("viewPdf")}
							</CardTitle>
							<Badge
								variant="outline"
								className="font-normal text-xs text-slate-500"
							>
								PDF
							</Badge>
						</CardHeader>
						<CardContent className="p-0">
							<div className="w-full aspect-3/4 min-h-[500px] sm:min-h-[600px] lg:min-h-[750px] relative bg-slate-100">
								<iframe
									src={`${book.uri}#toolbar=1`}
									className="absolute inset-0 w-full h-full border-0"
									title={book.title}
								/>
								{/* Fallback for no iframe support */}
								<div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50 pointer-events-none z-[-1]">
									<FileText className="size-12 text-slate-300 mb-3" />
									<p className="text-sm font-medium text-slate-600 mb-2">
										{t("noPdfViewer")}
									</p>
									<Button asChild size="sm" className="pointer-events-auto">
										<a
											href={book.uri}
											target="_blank"
											rel="noopener noreferrer"
										>
											{t("open")}
										</a>
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Book details */}
				<div className="lg:col-span-1 flex flex-col gap-6 sticky top-20">
					<Card className="border-slate-200/80 shadow-md bg-white sticky top-24">
						<CardContent className="p-6 flex flex-col gap-6">
							<div>
								<h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
									{book.title}
								</h1>
								{book.desc && (
									<p className="mt-3 text-slate-600 text-sm leading-relaxed">
										{book.desc}
									</p>
								)}
							</div>

							{/* Badges container */}
							<div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
								{book.category?.name && (
									<Badge variant="secondary" className="gap-1 font-normal">
										<Tag className="size-3" />
										{book.category.name}
									</Badge>
								)}
								{book.grade?.name && (
									<Badge variant="outline" className="gap-1 font-normal">
										<GraduationCap className="size-3" />
										{book.grade.name}
									</Badge>
								)}
								{book.subject?.name && (
									<Badge variant="outline" className="gap-1 font-normal">
										<BookOpen className="size-3" />
										{book.subject.name}
									</Badge>
								)}
							</div>

							{/* Actions */}
							<div className="border-t border-slate-100 pt-4 mt-2">
								<Button
									asChild
									size="lg"
									className="w-full gap-2 shadow-sm font-semibold"
								>
									<a
										href={book.uri}
										download
										aria-label={t("downloadBook", { title: book.title })}
									>
										<Download className="size-5" />
										{t("download")}
									</a>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

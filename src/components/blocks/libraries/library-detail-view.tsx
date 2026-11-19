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
			<div className="relative grid grid-cols-1 items-start gap-8 pb-12 lg:grid-cols-3">
				{/* Left Column: PDF Viewer */}
				<div className="flex flex-col gap-4 lg:col-span-2">
					<Card className="overflow-hidden border-border/80 bg-card shadow-md">
						<CardHeader className="flex flex-row items-center justify-between border-b border-border/70 bg-muted/35 px-6 py-4">
							<CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
								<FileText className="size-4 text-primary" />
								{t("viewPdf")}
							</CardTitle>
							<Badge
								variant="outline"
								className="text-xs font-normal text-muted-foreground"
							>
								PDF
							</Badge>
						</CardHeader>
						<CardContent className="p-0">
							<div className="relative aspect-3/4 min-h-[500px] w-full bg-muted/50 sm:min-h-[600px] lg:min-h-[750px]">
								<iframe
									src={`${book.uri}#toolbar=1`}
									className="absolute inset-0 h-full w-full border-0"
									title={book.title}
								/>
								{/* Fallback for no iframe support */}
								<div className="pointer-events-none absolute inset-0 z-[-1] flex flex-col items-center justify-center bg-muted/30 p-6 text-center">
									<FileText className="mb-3 size-12 text-muted-foreground/40" />
									<p className="mb-2 text-sm font-medium text-muted-foreground">
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
				<div className="sticky top-20 flex flex-col gap-6 lg:col-span-1">
					<Card className="sticky top-24 border-border/80 bg-card shadow-md">
						<CardContent className="flex flex-col gap-6 p-6">
							<div>
								<h1 className="text-2xl leading-tight font-bold tracking-tight text-foreground">
									{book.title}
								</h1>
								{book.desc && (
									<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
										{book.desc}
									</p>
								)}
							</div>

							{/* Badges container */}
							<div className="flex flex-wrap gap-1.5 border-t border-border/70 pt-4">
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
							<div className="mt-2 border-t border-border/70 pt-4">
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

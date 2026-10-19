"use client";

import { ExternalLink, HelpCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { findSimilarThreadsAction } from "@/lib/actions/discussions";
import { routes } from "@/lib/routes";
import type { DiscussionResourceType } from "@/types/discussion.types";

interface DuplicateThreadDrawerProps {
	title: string;
	content: string;
	resource_type: DiscussionResourceType;
	resource_id: string;
}

export function DuplicateThreadDrawer({
	title,
	content,
	resource_type,
	resource_id,
}: DuplicateThreadDrawerProps) {
	const t = useTranslations("discussions");
	const [matches, setMatches] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!title || title.trim().length < 5) {
			setMatches([]);
			return;
		}

		const timer = setTimeout(async () => {
			setLoading(true);
			try {
				const res = await findSimilarThreadsAction(
					title,
					content,
					resource_type,
					resource_id
				);
				setMatches(res || []);
			} catch {
				setMatches([]);
			} finally {
				setLoading(false);
			}
		}, 600);

		return () => clearTimeout(timer);
	}, [title, content, resource_type, resource_id]);

	if (matches.length === 0) return null;

	return (
		<Alert className="bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 my-3">
			<Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
			<AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold text-sm">
				{t("duplicate_check_title")}
			</AlertTitle>
			<AlertDescription className="text-xs text-amber-700 dark:text-amber-400 space-y-2 mt-1">
				<p>{t("duplicate_check_desc")}</p>
				<div className="space-y-1 pt-1">
					{matches.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between p-2 rounded bg-background/80 border text-foreground"
						>
							<span className="font-medium truncate max-w-[280px]">
								{item.title}
							</span>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 text-xs gap-1"
								asChild
							>
								<Link
									href={routes.d.courses.slug.page({
										slug: item.slug ?? item.id,
									})}
									target="_blank"
								>
									{t("view_thread")}
									<ExternalLink className="w-3 h-3" />
								</Link>
							</Button>
						</div>
					))}
				</div>
			</AlertDescription>
		</Alert>
	);
}

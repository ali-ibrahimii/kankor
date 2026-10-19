"use client";

import {
	CopyIcon,
	MoreHorizontalIcon,
	PencilIcon,
	TrashIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassroomMeta } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ClassroomCardProps {
	classroom: ClassroomMeta;
	editHref: string;
	onDeleted?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClassroomCard({
	classroom,
	editHref,
	onDeleted,
}: ClassroomCardProps) {
	const t = useTranslations("classroomBuilder");
	const memberCount = classroom.classroom_members?.[0]?.count ?? 0;

	function handleCopyJoinCode() {
		navigator.clipboard.writeText(classroom.join_code);
		toast.success(t("card.joinCodeCopied"));
	}

	return (
		<Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<h3 className="truncate font-semibold leading-tight">
							{classroom.name}
						</h3>
						{classroom.is_archived && (
							<Badge variant="secondary" className="mt-1 text-xs">
								{t("card.archived")}
							</Badge>
						)}
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
								aria-label={t("card.actions")}
							>
								<MoreHorizontalIcon className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link href={editHref}>
									<PencilIcon className="me-2 size-4" />
									{t("card.manage")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleCopyJoinCode}>
								<CopyIcon className="me-2 size-4" />
								{t("card.copyJoinCode")}
							</DropdownMenuItem>
							{onDeleted && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => onDeleted(classroom.id)}
									>
										<TrashIcon className="me-2 size-4" />
										{t("card.delete")}
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>

			<CardContent className="flex-1 pb-2">
				{classroom.description ? (
					<p className="line-clamp-2 text-sm text-muted-foreground">
						{classroom.description}
					</p>
				) : (
					<p className="text-sm text-muted-foreground/50 italic">
						{t("card.noDescription")}
					</p>
				)}
			</CardContent>

			<CardFooter className="flex items-center justify-between border-t pt-3">
				<div className="flex items-center gap-1 text-xs text-muted-foreground">
					<UsersIcon className="size-3.5" />
					<span>{t("card.members", { count: memberCount })}</span>
				</div>

				<button
					type="button"
					onClick={handleCopyJoinCode}
					className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					title={t("card.copyJoinCode")}
				>
					<CopyIcon className="size-3" />
					{classroom.join_code}
				</button>
			</CardFooter>
		</Card>
	);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ClassroomCardSkeleton() {
	return (
		<Card className="flex flex-col">
			<CardHeader className="pb-2">
				<Skeleton className="h-5 w-3/4" />
			</CardHeader>
			<CardContent className="flex-1 space-y-2 pb-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-2/3" />
			</CardContent>
			<CardFooter className="border-t pt-3">
				<Skeleton className="h-4 w-20" />
			</CardFooter>
		</Card>
	);
}

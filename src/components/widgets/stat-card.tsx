import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
	label: string;
	value: string | number;
	icon: LucideIcon;
	color?: string;
}

/** Compact icon + value + label card used across all dashboard overview pages. */
export function StatCard({
	label,
	value,
	icon: Icon,
	color = "text-blue-600",
}: StatCardProps) {
	return (
		<Card size="sm">
			<CardContent className="flex items-center gap-3 pt-4 pb-4">
				<div className="rounded-lg bg-muted p-2">
					<Icon className={cn("size-4", color)} />
				</div>
				<div className="min-w-0">
					<p className="text-xl font-bold tabular-nums leading-none">{value}</p>
					<p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
				</div>
			</CardContent>
		</Card>
	);
}

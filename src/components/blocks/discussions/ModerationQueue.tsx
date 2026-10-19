"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Lock, Pin, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { moderateDiscussionAction } from "@/lib/actions/discussions";
import { createClient } from "@/lib/supabase/client";

export function ModerationQueue() {
	const t = useTranslations("discussions");
	const supabase = createClient();

	const {
		data: reports,
		refetch,
		isLoading,
	} = useQuery({
		queryKey: ["discussion_reports_queue"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("discussion_reports")
				.select(`
          *,
          profiles!reporter_id(id, full_name, avatar_url)
        `)
				.eq("status", "pending")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data || [];
		},
	});

	const handleAction = async (
		reportId: string,
		action: "delete" | "dismiss",
		targetType: "thread" | "post",
		targetId: string
	) => {
		try {
			if (action === "delete") {
				await moderateDiscussionAction("delete", targetType, targetId);
			}
			await supabase
				.from("discussion_reports")
				.update({ status: action === "delete" ? "actioned" : "dismissed" })
				.eq("id", reportId);

			refetch();
		} catch (err: any) {
			alert(err.message || t("errors.mod_failed"));
		}
	};

	if (isLoading)
		return (
			<div className="p-6 text-center text-muted-foreground">
				{t("loading")}
			</div>
		);

	return (
		<div className="space-y-4 max-w-4xl mx-auto py-6">
			<div className="flex items-center justify-between border-b pb-4">
				<div>
					<h1 className="text-xl font-bold flex items-center gap-2">
						<ShieldAlert className="w-5 h-5 text-amber-600" />
						{t("moderation_queue_title")}
					</h1>
					<p className="text-xs text-muted-foreground">
						{t("moderation_queue_subtitle")}
					</p>
				</div>
				<Badge variant="secondary" className="font-mono">
					{reports?.length || 0} {t("pending")}
				</Badge>
			</div>

			{reports?.length === 0 ? (
				<div className="p-8 text-center text-muted-foreground border rounded-xl">
					{t("no_pending_reports")}
				</div>
			) : (
				<div className="space-y-3">
					{reports?.map((report: any) => (
						<Card key={report.id} className="border-l-4 border-l-amber-500">
							<CardContent className="p-4 space-y-3">
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>
										{t("reported_by")}:{" "}
										<strong className="text-foreground">
											{report.profiles?.full_name}
										</strong>
									</span>
									<Badge variant="outline" className="capitalize">
										{report.reason}
									</Badge>
								</div>

								{report.details && (
									<p className="text-sm bg-muted/40 p-2.5 rounded italic">
										"{report.details}"
									</p>
								)}

								<div className="flex items-center justify-end gap-2 pt-2 border-t">
									<Button
										variant="ghost"
										size="sm"
										className="text-xs gap-1"
										onClick={() =>
											handleAction(
												report.id,
												"dismiss",
												report.target_type,
												report.target_id
											)
										}
									>
										<Check className="w-3.5 h-3.5" />
										{t("dismiss")}
									</Button>
									<Button
										variant="destructive"
										size="sm"
										className="text-xs gap-1"
										onClick={() =>
											handleAction(
												report.id,
												"delete",
												report.target_type,
												report.target_id
											)
										}
									>
										<Trash2 className="w-3.5 h-3.5" />
										{t("soft_delete")}
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

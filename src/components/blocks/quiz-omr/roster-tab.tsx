"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle2Icon,
	Loader2Icon,
	SearchIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	addRegistration,
	findStudentByEmail,
	listRegistrations,
	removeRegistration,
} from "./actions";

export interface RosterTabProps {
	quizId: string;
	registrationDeadline: string | null;
}

export function RosterTab({ quizId, registrationDeadline }: RosterTabProps) {
	const t = useTranslations("quizOmr.roster");
	const queryClient = useQueryClient();
	const queryKey = ["quiz-omr", quizId, "registrations"];

	const { data: registrations, isLoading } = useQuery({
		queryKey,
		queryFn: async () => {
			const result = await listRegistrations(quizId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
	});

	const [email, setEmail] = React.useState("");
	const [isSearching, setIsSearching] = React.useState(false);
	const [isAdding, setIsAdding] = React.useState(false);
	const [removingId, setRemovingId] = React.useState<string | null>(null);

	async function handleAdd() {
		if (!email.trim()) return;
		setIsSearching(true);
		const lookup = await findStudentByEmail(email);
		setIsSearching(false);

		if (!lookup.success) {
			toast.error(lookup.error);
			return;
		}
		if (!lookup.data) {
			toast.error(t("notFound"));
			return;
		}
		if (registrations?.some((r) => r.student_id === lookup.data?.id)) {
			toast.error(t("alreadyRegistered"));
			return;
		}

		setIsAdding(true);
		const result = await addRegistration(quizId, lookup.data.id);
		setIsAdding(false);
		if (result.success) {
			toast.success(t("added", { name: lookup.data.full_name ?? email }));
			setEmail("");
			queryClient.invalidateQueries({ queryKey });
		} else {
			toast.error(result.error);
		}
	}

	async function handleRemove(registrationId: string) {
		setRemovingId(registrationId);
		const result = await removeRegistration(registrationId);
		setRemovingId(null);
		if (result.success) {
			queryClient.invalidateQueries({ queryKey });
		} else {
			toast.error(result.error);
		}
	}

	const deadlinePassed =
		!!registrationDeadline && new Date(registrationDeadline) < new Date();

	return (
		<div className="max-w-3xl space-y-4">
			<div className="rounded-xl border p-4">
				<p className="mb-2 text-sm font-medium">{t("addTitle")}</p>
				<p className="mb-3 text-xs text-muted-foreground">
					{t("addDescription")}
				</p>
				<div className="flex gap-2">
					<Input
						type="email"
						placeholder={t("emailPlaceholder")}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleAdd()}
						disabled={isSearching || isAdding}
					/>
					<Button onClick={handleAdd} disabled={isSearching || isAdding}>
						{isSearching || isAdding ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							<SearchIcon className="size-4" />
						)}
						{t("addAction")}
					</Button>
				</div>
				{deadlinePassed && (
					<p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
						{t("deadlinePassedOwnerNote")}
					</p>
				)}
			</div>

			{isLoading ? (
				<div className="flex justify-center py-10">
					<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
				</div>
			) : !registrations || registrations.length === 0 ? (
				<div className="rounded-xl border border-dashed bg-muted/30 py-14 text-center">
					<UsersIcon className="mx-auto mb-3 size-9 text-muted-foreground/30" />
					<p className="text-sm font-medium">{t("empty.title")}</p>
					<p className="mt-1 text-xs text-muted-foreground">
						{t("empty.description")}
					</p>
				</div>
			) : (
				<div className="rounded-xl border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("table.student")}</TableHead>
								<TableHead>{t("table.source")}</TableHead>
								<TableHead>{t("table.printed")}</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{registrations.map((r) => (
								<TableRow key={r.id}>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-medium">
												{r.student_full_name ?? t("unknownStudent")}
											</span>
											<span className="text-xs text-muted-foreground">
												{r.student_email}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="secondary">
											{r.source === "self" ? t("sourceSelf") : t("sourceOwner")}
										</Badge>
									</TableCell>
									<TableCell>
										{r.has_current_variant ? (
											<span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
												<CheckCircle2Icon className="size-3.5" />
												{t("printed")}
											</span>
										) : (
											<span className="text-xs text-muted-foreground">
												{t("notPrinted")}
											</span>
										)}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon-sm"
											className="text-muted-foreground hover:text-destructive"
											disabled={removingId === r.id}
											onClick={() => handleRemove(r.id)}
										>
											{removingId === r.id ? (
												<Loader2Icon className="size-4 animate-spin" />
											) : (
												<Trash2Icon className="size-4" />
											)}
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}

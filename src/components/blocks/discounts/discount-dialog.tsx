"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
	createDiscount,
	listDiscountableItems,
	updateDiscount,
} from "./actions";
import { DiscountTargetPicker } from "./discount-target-picker";
import type {
	DiscountableItem,
	DiscountFormValues,
	DiscountRow,
} from "./types";
import { DEFAULT_DISCOUNT_FORM_VALUES } from "./types";

export interface DiscountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Set when creating/editing on behalf of a school (item/group scope only). */
	schoolId?: string;
	/** Only admins may create/see the "all" (platform-wide) scope. */
	canCreateGlobal: boolean;
	/** When set, the dialog edits this discount instead of creating a new one. */
	editingDiscount?: DiscountRow | null;
	onSaved: () => void;
}

function toDateTimeLocal(value: string | null): string {
	if (!value) return "";
	const date = new Date(value);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DiscountDialog({
	open,
	onOpenChange,
	schoolId,
	canCreateGlobal,
	editingDiscount,
	onSaved,
}: DiscountDialogProps) {
	const t = useTranslations("discounts.dialog");
	const isEditMode = !!editingDiscount;
	const [isPending, setIsPending] = React.useState(false);
	const [values, setValues] = React.useState<DiscountFormValues>(
		DEFAULT_DISCOUNT_FORM_VALUES
	);
	const [items, setItems] = React.useState<DiscountableItem[]>([]);
	const [isLoadingItems, setIsLoadingItems] = React.useState(false);

	React.useEffect(() => {
		if (!open) return;
		if (editingDiscount) {
			setValues({
				code: editingDiscount.code,
				type: editingDiscount.type,
				value: String(editingDiscount.value),
				scope: editingDiscount.scope,
				targetKeys: [],
				startsAt: toDateTimeLocal(editingDiscount.starts_at),
				endsAt: toDateTimeLocal(editingDiscount.ends_at),
				isActive: editingDiscount.is_active,
			});
		} else {
			setValues(DEFAULT_DISCOUNT_FORM_VALUES);
		}
	}, [open, editingDiscount]);

	React.useEffect(() => {
		if (!open || isEditMode) return;
		let cancelled = false;
		setIsLoadingItems(true);
		listDiscountableItems(schoolId).then((result) => {
			if (cancelled) return;
			if (result.success) setItems(result.data);
			setIsLoadingItems(false);
		});
		return () => {
			cancelled = true;
		};
	}, [open, isEditMode, schoolId]);

	function patch<K extends keyof DiscountFormValues>(
		key: K,
		value: DiscountFormValues[K]
	) {
		setValues((prev) => ({ ...prev, [key]: value }));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!values.code.trim()) {
			toast.error(t("validation.codeRequired"));
			return;
		}
		if (!values.value || Number(values.value) <= 0) {
			toast.error(t("validation.valueRequired"));
			return;
		}
		if (
			!isEditMode &&
			values.scope !== "all" &&
			values.targetKeys.length === 0
		) {
			toast.error(t("validation.targetsRequired"));
			return;
		}

		setIsPending(true);
		try {
			if (isEditMode && editingDiscount) {
				const result = await updateDiscount(editingDiscount.id, values);
				if (!result.success) {
					toast.error(result.error);
					return;
				}
				toast.success(t("updated"));
			} else {
				const result = await createDiscount(values, schoolId);
				if (!result.success) {
					toast.error(result.error);
					return;
				}
				toast.success(t("created"));
			}
			onOpenChange(false);
			onSaved();
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{isEditMode ? t("editTitle") : t("createTitle")}
						</DialogTitle>
						<DialogDescription>
							{isEditMode ? t("editDescription") : t("createDescription")}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 max-h-[65vh] space-y-4 overflow-y-auto pe-1">
						<div className="space-y-1.5">
							<Label htmlFor="discount-code">{t("codeLabel")}</Label>
							<Input
								id="discount-code"
								value={values.code}
								onChange={(e) => patch("code", e.target.value.toUpperCase())}
								placeholder={t("codePlaceholder")}
								maxLength={40}
								autoFocus
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="discount-type">{t("typeLabel")}</Label>
								<Select
									value={values.type}
									onValueChange={(v) =>
										patch("type", v as DiscountFormValues["type"])
									}
									disabled={isEditMode}
								>
									<SelectTrigger id="discount-type">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="percentage">
											{t("type.percentage")}
										</SelectItem>
										<SelectItem value="fixed">{t("type.fixed")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="discount-value">
									{values.type === "percentage"
										? t("valueLabelPercentage")
										: t("valueLabelFixed")}
								</Label>
								<Input
									id="discount-value"
									type="number"
									min="0"
									max={values.type === "percentage" ? "100" : undefined}
									step="1"
									value={values.value}
									onChange={(e) => patch("value", e.target.value)}
									placeholder="0"
								/>
							</div>
						</div>

						{!isEditMode && (
							<div className="space-y-1.5">
								<Label htmlFor="discount-scope">{t("scopeLabel")}</Label>
								<Select
									value={values.scope}
									onValueChange={(v) =>
										patch("scope", v as DiscountFormValues["scope"])
									}
								>
									<SelectTrigger id="discount-scope">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="item">{t("scope.item")}</SelectItem>
										<SelectItem value="group">{t("scope.group")}</SelectItem>
										{canCreateGlobal && (
											<SelectItem value="all">{t("scope.all")}</SelectItem>
										)}
									</SelectContent>
								</Select>
							</div>
						)}

						{!isEditMode && values.scope !== "all" && (
							<DiscountTargetPicker
								items={items}
								isLoading={isLoadingItems}
								selected={values.targetKeys}
								onChange={(keys) => patch("targetKeys", keys)}
								multiple={values.scope === "group"}
							/>
						)}

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="discount-starts">{t("startsAtLabel")}</Label>
								<Input
									id="discount-starts"
									type="datetime-local"
									value={values.startsAt}
									onChange={(e) => patch("startsAt", e.target.value)}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="discount-ends">{t("endsAtLabel")}</Label>
								<Input
									id="discount-ends"
									type="datetime-local"
									value={values.endsAt}
									onChange={(e) => patch("endsAt", e.target.value)}
								/>
							</div>
						</div>

						{isEditMode && (
							<div className="flex items-center justify-between rounded-lg border p-3">
								<div>
									<p className="text-sm font-medium">{t("activeLabel")}</p>
									<p className="text-xs text-muted-foreground">
										{t("activeDescription")}
									</p>
								</div>
								<Switch
									checked={values.isActive}
									onCheckedChange={(v) => patch("isActive", v)}
								/>
							</div>
						)}
					</div>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							{t("cancel")}
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending && <Spinner className="size-4" />}
							{isPending ? t("saving") : isEditMode ? t("save") : t("create")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

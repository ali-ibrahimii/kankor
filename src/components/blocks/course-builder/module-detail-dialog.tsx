"use client";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { patchModuleAtom } from "./store";
import type { DraftModule } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModuleDetailDialogProps {
	module: DraftModule | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ModuleDetailDialog({
	module,
	open,
	onOpenChange,
}: ModuleDetailDialogProps) {
	const t = useTranslations("courseBuilder");
	const patchModule = useSetAtom(patchModuleAtom);

	const [title, setTitle] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [startPage, setStartPage] = React.useState("");
	const [endPage, setEndPage] = React.useState("");

	// Sync local state when module changes
	React.useEffect(() => {
		if (module) {
			setTitle(module.title);
			setDescription(module.description ?? "");
			setStartPage(module.start_page?.toString() ?? "");
			setEndPage(module.end_page?.toString() ?? "");
		}
	}, [module]);

	function handleSave() {
		if (!module) return;
		patchModule({
			id: module.id,
			patch: {
				title: title.trim() || t("module.untitled"),
				description: description.trim() || null,
				start_page: startPage ? Number(startPage) : null,
				end_page: endPage ? Number(endPage) : null,
			},
		});
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("module.editDetails")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label htmlFor="mod-title">{t("module.titleLabel")}</Label>
						<Input
							id="mod-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("module.titlePlaceholder")}
							autoFocus
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="mod-desc">{t("module.descriptionLabel")}</Label>
						<Textarea
							id="mod-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t("module.descriptionPlaceholder")}
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="mod-start">{t("module.startPage")}</Label>
							<Input
								id="mod-start"
								type="number"
								min="1"
								value={startPage}
								onChange={(e) => setStartPage(e.target.value)}
								placeholder="—"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="mod-end">{t("module.endPage")}</Label>
							<Input
								id="mod-end"
								type="number"
								min="1"
								value={endPage}
								onChange={(e) => setEndPage(e.target.value)}
								placeholder="—"
							/>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button onClick={handleSave}>{t("common.save")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

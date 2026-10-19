"use client";

import { Check, CircleHelp, Copy, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { DemoCourse, DemoStatus, DemoUser } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

export function DemoPanel({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={cn("demo-card", className)}>{children}</div>;
}

export function DemoHeading({
	eyebrow,
	title,
	description,
	action,
}: {
	eyebrow?: string;
	title: string;
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div className="min-w-0">
				{eyebrow && <span className="demo-eyebrow">{eyebrow}</span>}
				<h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#19243b] dark:text-foreground sm:text-[1.8rem]">
					{title}
				</h2>
				{description && (
					<p className="mt-2 text-sm leading-7 text-slate-500 dark:text-muted-foreground">
						{description}
					</p>
				)}
			</div>
			{action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
		</div>
	);
}

export function DemoEmpty({
	icon: Icon = CircleHelp,
	title,
	description,
	action,
}: {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<DemoPanel className="flex flex-col items-center justify-center px-5 py-14 text-center">
			<div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
				<Icon className="size-6" />
			</div>
			<p className="font-bold text-[#19243b]">{title}</p>
			{description && (
				<p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
					{description}
				</p>
			)}
			{action && <div className="mt-5">{action}</div>}
		</DemoPanel>
	);
}

export function DemoAvatar({
	user,
	size = "md",
}: {
	user: DemoUser;
	size?: "md" | "lg";
}) {
	return (
		<span
			aria-hidden="true"
			className={cn("demo-avatar", size === "lg" && "size-12 text-lg")}
		>
			{user.name.trim().charAt(0)}
		</span>
	);
}

export function DemoStatusBadge({ status }: { status: DemoStatus }) {
	const t = useTranslations("demo");
	return (
		<span className={cn("demo-status", `demo-status--${status}`)}>
			{t(`status.${status}`)}
		</span>
	);
}

export function DemoField({
	label,
	htmlFor,
	children,
}: {
	label: string;
	htmlFor?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<label
				className="block text-xs font-bold text-slate-700"
				htmlFor={htmlFor}
			>
				{label}
			</label>
			{children}
		</div>
	);
}

export function DemoConfirm({
	title,
	description,
	onConfirm,
	children,
	destructive = false,
}: {
	title: string;
	description: string;
	onConfirm: () => void;
	children: React.ReactNode;
	destructive?: boolean;
}) {
	const t = useTranslations("demo");
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent className="demo-card border-0">
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						variant={destructive ? "destructive" : "default"}
						onClick={onConfirm}
					>
						{t("common.confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function CourseArt({
	course,
	size = "card",
}: {
	course: Pick<DemoCourse, "color" | "subject">;
	size?: "card" | "small";
}) {
	const icons = { violet: "∑", mint: "✦", peach: "✳", sky: "⚛" };
	return (
		<div
			className={cn(
				"demo-course-art",
				`demo-course-art--${course.color}`,
				size === "small" && "demo-course-art--small"
			)}
		>
			<span aria-hidden="true" className="demo-course-symbol">
				{icons[course.color]}
			</span>
			<span className="demo-course-subject">{course.subject}</span>
		</div>
	);
}

export function CopyButton({
	text,
	label,
	className,
}: {
	text: string;
	label: string;
	className?: string;
}) {
	const t = useTranslations("demo");
	const [copied, setCopied] = React.useState(false);
	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			className={cn("demo-rounded", className)}
			aria-label={label}
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(text);
					setCopied(true);
					toast.success(t("common.copied"));
					window.setTimeout(() => setCopied(false), 1700);
				} catch {
					toast.error(t("errors.copyFailed"));
				}
			}}
		>
			{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{" "}
			{label}
		</Button>
	);
}

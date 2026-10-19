"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import * as React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const mediaVariants = cva(
	"mb-2 inline-flex size-16 items-center justify-center rounded-md border sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8",
	{
		variants: {
			variant: {
				default: "hidden",
				info: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30",
				warning:
					"bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30",
				error:
					"bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/30",
				destructive:
					"bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/30",
				success:
					"bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
);

const iconVariants = cva("size-6", {
	variants: {
		variant: {
			default: "",
			info: "text-blue-600 dark:text-blue-400",
			warning: "text-amber-600 dark:text-amber-400",
			error: "text-red-600 dark:text-red-400",
			destructive: "text-red-600 dark:text-red-400",
			success: "text-emerald-600 dark:text-emerald-400",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

const variantIcons = {
	default: null,
	info: Info,
	warning: AlertTriangle,
	error: XCircle,
	destructive: XCircle,
	success: CheckCircle,
};

export type ConfirmDialogVariant = NonNullable<
	VariantProps<typeof mediaVariants>["variant"]
>;

export interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: React.ReactNode;
	description: React.ReactNode;
	onConfirm: () => void;
	onCancel?: () => void;
	confirmText?: string;
	cancelText?: string;
	variant?: ConfirmDialogVariant;
	isLoading?: boolean;
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	onConfirm,
	onCancel,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "default",
	isLoading = false,
}: ConfirmDialogProps) {
	const Icon = variantIcons[variant];
	const isDestructive = variant === "destructive" || variant === "error";

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					{Icon && (
						<AlertDialogMedia className={cn(mediaVariants({ variant }))}>
							<Icon className={cn(iconVariants({ variant }))} />
						</AlertDialogMedia>
					)}
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel} disabled={isLoading}>
						{cancelText}
					</AlertDialogCancel>
					<AlertDialogAction
						variant={isDestructive ? "destructive" : "default"}
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
						disabled={isLoading}
					>
						{isLoading && <Spinner className="size-4 mr-2" />}
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

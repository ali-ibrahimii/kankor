"use client";

import { CheckIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type StepState = "complete" | "current" | "upcoming";

const StepperContext = React.createContext<{ currentStep: number } | null>(
	null
);

function useStepper() {
	const context = React.useContext(StepperContext);
	if (!context) throw new Error("Stepper parts must be used within <Stepper>");
	return context;
}

const StepperItemContext = React.createContext<{
	step: number;
	state: StepState;
} | null>(null);

function useStepperItem() {
	const context = React.useContext(StepperItemContext);
	if (!context)
		throw new Error(
			"StepperIndicator/StepperTitle must be used within <StepperItem>"
		);
	return context;
}

/** Generic, controlled step indicator. Pass the active step's index via `currentStep`. */
function Stepper({
	currentStep,
	className,
	...props
}: React.ComponentProps<"div"> & { currentStep: number }) {
	return (
		<StepperContext.Provider value={{ currentStep }}>
			<div
				data-slot="stepper"
				className={cn("flex w-full items-center", className)}
				{...props}
			/>
		</StepperContext.Provider>
	);
}

function StepperItem({
	step,
	className,
	...props
}: React.ComponentProps<"div"> & { step: number }) {
	const { currentStep } = useStepper();
	const state: StepState =
		step < currentStep
			? "complete"
			: step === currentStep
				? "current"
				: "upcoming";

	return (
		<StepperItemContext.Provider value={{ step, state }}>
			<div
				data-slot="stepper-item"
				data-state={state}
				className={cn(
					"group/stepper-item flex flex-1 items-center gap-2 last:flex-none",
					className
				)}
				{...props}
			/>
		</StepperItemContext.Provider>
	);
}

function StepperIndicator({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	const { step, state } = useStepperItem();

	return (
		<div
			data-slot="stepper-indicator"
			data-state={state}
			className={cn(
				"flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
				state === "complete" &&
					"border-primary bg-primary text-primary-foreground",
				state === "current" && "border-primary text-primary",
				state === "upcoming" && "border-border text-muted-foreground",
				className
			)}
			{...props}
		>
			{children ??
				(state === "complete" ? <CheckIcon className="size-3.5" /> : step + 1)}
		</div>
	);
}

function StepperTitle({ className, ...props }: React.ComponentProps<"span">) {
	const { state } = useStepperItem();

	return (
		<span
			data-slot="stepper-title"
			data-state={state}
			className={cn(
				"text-sm font-medium whitespace-nowrap",
				state === "upcoming" ? "text-muted-foreground" : "text-foreground",
				className
			)}
			{...props}
		/>
	);
}

function StepperSeparator({
	className,
	...props
}: React.ComponentProps<"div">) {
	const { state } = useStepperItem();

	return (
		<div
			data-slot="stepper-separator"
			data-state={state}
			className={cn(
				"mx-2 h-px flex-1 bg-border transition-colors group-last/stepper-item:hidden",
				state === "complete" && "bg-primary",
				className
			)}
			{...props}
		/>
	);
}

export {
	Stepper,
	StepperIndicator,
	StepperItem,
	StepperSeparator,
	StepperTitle,
};

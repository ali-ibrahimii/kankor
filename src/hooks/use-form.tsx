"use client";

import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { Eye, EyeOff, LoaderIcon } from "lucide-react";
import { type ComponentProps, Fragment, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LexicalEditor } from "@/features/editor/lexical-editor";
import { cn } from "@/lib/utils";

export const { fieldContext, useFieldContext, useFormContext, formContext } =
	createFormHookContexts();

// ── Shared helpers ────────────────────────────────────────────────────────────

function toErrors(errors: unknown[]): Array<{ message?: string }> {
	return errors.map((e) => ({
		message:
			typeof e === "string"
				? e
				: typeof e === "object" && e !== null && "message" in e
					? String((e as Record<string, unknown>).message)
					: undefined,
	}));
}

// Re-exported option type used by SelectField, NativeSelectField, ComboboxField, RadioGroupField
export type FormOption = { value: string; label: string };

// ── TextField ─────────────────────────────────────────────────────────────────

type TextFieldProps = ComponentProps<typeof Input> & {
	label?: string;
	description?: string;
	renderLable?: ({
		label,
		description,
		hasErrors,
		errors,
	}: {
		label: string | undefined;
		description: string | undefined;
		hasErrors: boolean;
		errors: Array<{ message?: string }>;
	}) => React.ReactNode;
};

function TextField({
	label,
	description,
	renderLable,
	...inputProps
}: TextFieldProps) {
	const field = useFieldContext<string>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);

	return (
		<Field data-invalid={hasErrors ? "true" : undefined}>
			{renderLable?.({
				label,
				description,
				hasErrors,
				errors,
			}) ??
				(label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null)}
			<Input
				id={field.name}
				name={field.name}
				value={field.state.value ?? ""}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				aria-invalid={hasErrors || undefined}
				{...inputProps}
			/>
			{description && !hasErrors && (
				<FieldDescription>{description}</FieldDescription>
			)}
			<FieldError errors={errors} />
		</Field>
	);
}

function PasswordField({
	label,
	description,
	renderLable,
	...inputProps
}: TextFieldProps) {
	const field = useFieldContext<string>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);
	const [type, setType] = useState("password");

	return (
		<Field data-invalid={hasErrors ? "true" : undefined}>
			{renderLable?.({
				label,
				description,
				hasErrors,
				errors,
			}) ??
				(label ? <FieldLabel htmlFor={field.name}>{label}</FieldLabel> : null)}
			<InputGroup>
				<InputGroupInput
					id={field.name}
					type={type}
					name={field.name}
					value={field.state.value ?? ""}
					onChange={(e) => field.handleChange(e.target.value)}
					onBlur={field.handleBlur}
					aria-invalid={hasErrors || undefined}
					{...inputProps}
				/>
				<InputGroupButton
					onClick={() => setType(type === "password" ? "text" : "password")}
				>
					{type === "password" ? <Eye /> : <EyeOff />}
				</InputGroupButton>
			</InputGroup>
			{description && !hasErrors && (
				<FieldDescription>{description}</FieldDescription>
			)}
			<FieldError errors={errors} />
		</Field>
	);
}

// ── TextareaField ─────────────────────────────────────────────────────────────

type TextareaFieldProps = ComponentProps<typeof Textarea> & {
	label?: string;
	description?: string;
};

function TextareaField({
	label,
	description,
	...textareaProps
}: TextareaFieldProps) {
	const field = useFieldContext<string>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);

	return (
		<Field data-invalid={hasErrors ? "true" : undefined}>
			{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
			<Textarea
				id={field.name}
				name={field.name}
				value={field.state.value ?? ""}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				aria-invalid={hasErrors || undefined}
				{...textareaProps}
			/>
			{description && !hasErrors && (
				<FieldDescription>{description}</FieldDescription>
			)}
			<FieldError errors={errors} />
		</Field>
	);
}

// ── LexicalEditorField ────────────────────────────────────────────────────────

type LexicalEditorFieldProps = {
	label?: string;
	description?: string;
	placeholder?: string;
	className?: string;
};

function LexicalEditorField({
	label,
	description,
	placeholder,
	className,
}: LexicalEditorFieldProps) {
	const field = useFieldContext<string>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);

	return (
		<Field data-invalid={hasErrors ? "true" : undefined}>
			{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
			<LexicalEditor
				content={field.state.value ?? ""}
				onChange={(val) => field.handleChange(val)}
				placeholder={placeholder}
				className={className}
			/>
			{description && !hasErrors && (
				<FieldDescription>{description}</FieldDescription>
			)}
			<FieldError errors={errors} />
		</Field>
	);
}

// ── CheckboxField ─────────────────────────────────────────────────────────────

type CheckboxFieldProps = Omit<
	ComponentProps<typeof Checkbox>,
	"checked" | "onCheckedChange"
> & {
	label?: string;
	description?: string;
};

function CheckboxField({
	label,
	description,
	...checkboxProps
}: CheckboxFieldProps) {
	const field = useFieldContext<boolean>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);

	return (
		<Field
			orientation="horizontal"
			data-invalid={hasErrors ? "true" : undefined}
		>
			<Checkbox
				id={field.name}
				checked={field.state.value ?? false}
				onCheckedChange={(checked) => field.handleChange(checked === true)}
				onBlur={field.handleBlur}
				aria-invalid={hasErrors || undefined}
				{...checkboxProps}
			/>
			{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldError errors={errors} />
		</Field>
	);
}

// ── RadioGroupField ───────────────────────────────────────────────────────────

type RadioOption = FormOption & { description?: string };

type RadioGroupFieldProps = {
	label?: string;
	description?: string;
	options: RadioOption[];
	orientation?: "horizontal" | "vertical";
};

function RadioGroupField({
	label,
	description,
	options,
	orientation = "vertical",
}: RadioGroupFieldProps) {
	const field = useFieldContext<string>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);

	return (
		<FieldSet data-invalid={hasErrors ? "true" : undefined}>
			{label && <FieldLegend variant="label">{label}</FieldLegend>}
			<RadioGroup
				value={field.state.value ?? ""}
				onValueChange={(value) => field.handleChange(value)}
				onBlur={field.handleBlur}
				className={cn(
					orientation === "horizontal" && "grid-flow-col auto-cols-fr"
				)}
			>
				{options.map((option) => (
					<Field key={option.value} orientation="horizontal">
						<RadioGroupItem
							value={option.value}
							id={`${field.name}-${option.value}`}
							aria-invalid={hasErrors || undefined}
						/>
						<FieldContent>
							<FieldLabel htmlFor={`${field.name}-${option.value}`}>
								{option.label}
							</FieldLabel>
							{option.description && (
								<FieldDescription>{option.description}</FieldDescription>
							)}
						</FieldContent>
					</Field>
				))}
			</RadioGroup>
			{description && !hasErrors && (
				<FieldDescription>{description}</FieldDescription>
			)}
			<FieldError errors={errors} />
		</FieldSet>
	);
}

// ── SelectField ───────────────────────────────────────────────────────────────

type SelectFieldProps = {
	label?: string;
	description?: string;
	placeholder?: string;
	options: FormOption[];
	className?: string;
};

function SelectField({
	label,
	description,
	placeholder,
	options,
	className,
}: SelectFieldProps) {
	const field = useFieldContext<string>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);

	return (
		<Field data-invalid={hasErrors ? "true" : undefined}>
			{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
			<Select
				value={field.state.value ?? ""}
				onValueChange={(value) => field.handleChange(value)}
			>
				<SelectTrigger
					id={field.name}
					aria-invalid={hasErrors || undefined}
					className={className ?? "w-full"}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{description && !hasErrors && (
				<FieldDescription>{description}</FieldDescription>
			)}
			<FieldError errors={errors} />
		</Field>
	);
}

// ── NativeSelectField ─────────────────────────────────────────────────────────

type NativeSelectFieldProps = {
	label?: string;
	description?: string;
	placeholder?: string;
	options: FormOption[];
	size?: "sm" | "default";
	className?: string;
};

function NativeSelectField({
	label,
	description,
	placeholder,
	options,
	size,
	className,
}: NativeSelectFieldProps) {
	const field = useFieldContext<string>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);

	return (
		<Field data-invalid={hasErrors ? "true" : undefined}>
			{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
			<NativeSelect
				id={field.name}
				name={field.name}
				value={field.state.value ?? ""}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				aria-invalid={hasErrors || undefined}
				size={size}
				className={className ?? "w-full"}
			>
				{placeholder && (
					<NativeSelectOption value="" disabled>
						{placeholder}
					</NativeSelectOption>
				)}
				{options.map((option) => (
					<NativeSelectOption key={option.value} value={option.value}>
						{option.label}
					</NativeSelectOption>
				))}
			</NativeSelect>
			{description && !hasErrors && (
				<FieldDescription>{description}</FieldDescription>
			)}
			<FieldError errors={errors} />
		</Field>
	);
}

// ── ComboboxField ─────────────────────────────────────────────────────────────

type ComboboxFieldProps = {
	label?: string;
	description?: string;
	placeholder?: string;
	emptyText?: string;
	options: FormOption[];
	showClear?: boolean;
	className?: string;
};

function ComboboxField({
	label,
	description,
	placeholder,
	emptyText,
	options,
	showClear = false,
	className,
}: ComboboxFieldProps) {
	const field = useFieldContext<string>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);
	const selected =
		options.find((option) => option.value === field.state.value) ?? null;

	return (
		<Field data-invalid={hasErrors ? "true" : undefined}>
			{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
			<Combobox<FormOption>
				items={options}
				value={selected}
				onValueChange={(option) => field.handleChange(option?.value ?? "")}
				itemToStringValue={(item) => item.value}
				itemToStringLabel={(item) => item.label}
			>
				<ComboboxInput
					id={field.name}
					placeholder={placeholder}
					onBlur={field.handleBlur}
					aria-invalid={hasErrors || undefined}
					showClear={showClear}
					className={className ?? "w-full"}
				/>
				<ComboboxContent>
					<ComboboxEmpty>{emptyText}</ComboboxEmpty>
					<ComboboxList>
						{(option) => (
							<ComboboxItem key={option.value} value={option}>
								{option.label}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			{description && !hasErrors && (
				<FieldDescription>{description}</FieldDescription>
			)}
			<FieldError errors={errors} />
		</Field>
	);
}

// ── SwitchField ───────────────────────────────────────────────────────────────

type SwitchFieldProps = Omit<
	ComponentProps<typeof Switch>,
	"checked" | "onCheckedChange"
> & {
	label?: string;
	description?: string;
};

function SwitchField({ label, description, ...switchProps }: SwitchFieldProps) {
	const field = useFieldContext<boolean>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);

	return (
		<Field
			orientation="horizontal"
			data-invalid={hasErrors ? "true" : undefined}
		>
			<Switch
				id={field.name}
				checked={field.state.value ?? false}
				onCheckedChange={(checked) => field.handleChange(checked)}
				onBlur={field.handleBlur}
				aria-invalid={hasErrors || undefined}
				{...switchProps}
			/>
			{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
			{description && <FieldDescription>{description}</FieldDescription>}
			<FieldError errors={errors} />
		</Field>
	);
}

// ── SliderField ───────────────────────────────────────────────────────────────

type SliderFieldProps = Omit<
	ComponentProps<typeof Slider>,
	"value" | "onValueChange" | "onValueCommit"
> & {
	label?: string;
	description?: string;
	showValue?: boolean;
};

function SliderField({
	label,
	description,
	showValue = false,
	min = 0,
	max = 100,
	...sliderProps
}: SliderFieldProps) {
	const field = useFieldContext<number>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);
	const currentValue = field.state.value ?? min;

	return (
		<Field data-invalid={hasErrors ? "true" : undefined}>
			{(label || showValue) && (
				<div className="flex items-center justify-between">
					{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
					{showValue && (
						<span className="text-sm tabular-nums text-muted-foreground">
							{currentValue}
						</span>
					)}
				</div>
			)}
			<Slider
				id={field.name}
				min={min}
				max={max}
				value={[currentValue]}
				onValueChange={([val]) => field.handleChange(val)}
				onValueCommit={() => field.handleBlur()}
				{...sliderProps}
			/>
			{description && !hasErrors && (
				<FieldDescription>{description}</FieldDescription>
			)}
			<FieldError errors={errors} />
		</Field>
	);
}

// ── OtpField ──────────────────────────────────────────────────────────────────

type OtpFieldProps = {
	label?: string;
	description?: string;
	maxLength?: number;
	/** Slot counts per group, e.g. [3, 3] renders "123 — 456". Defaults to a centered split. */
	groupSizes?: number[];
};

function OtpField({
	label,
	description,
	maxLength = 6,
	groupSizes,
}: OtpFieldProps) {
	const field = useFieldContext<string>();
	const errors = toErrors(field.state.meta.errors);
	const hasErrors = errors.some((e) => e.message);

	const resolvedGroupSizes =
		groupSizes ??
		(maxLength > 3
			? [Math.ceil(maxLength / 2), Math.floor(maxLength / 2)]
			: [maxLength]);

	// Pre-compute slot indices so we don't mutate inside JSX
	let cursor = 0;
	const groups = resolvedGroupSizes.map((size) => {
		const slots = Array.from({ length: size }, (_, i) => cursor + i);
		cursor += size;
		return slots;
	});

	return (
		<Field data-invalid={hasErrors ? "true" : undefined}>
			{label && <FieldLabel>{label}</FieldLabel>}
			<InputOTP
				maxLength={maxLength}
				value={field.state.value ?? ""}
				onChange={(value) => field.handleChange(value)}
				onBlur={field.handleBlur}
				aria-invalid={hasErrors || undefined}
			>
				{groups.map((slots, groupIdx) => (
					<Fragment key={groupIdx}>
						{groupIdx > 0 && <InputOTPSeparator />}
						<InputOTPGroup>
							{slots.map((slotIndex) => (
								<InputOTPSlot key={slotIndex} index={slotIndex} />
							))}
						</InputOTPGroup>
					</Fragment>
				))}
			</InputOTP>
			{description && !hasErrors && (
				<FieldDescription>{description}</FieldDescription>
			)}
			<FieldError errors={errors} />
		</Field>
	);
}

// ── SubmitButton (formComponent) ──────────────────────────────────────────────

function SubmitButton({ children, ...rest }: ButtonProps) {
	const form = useFormContext();
	const isSubmitting = form.state.isSubmitting;

	return (
		<Button type="submit" disabled={isSubmitting} {...rest}>
			{isSubmitting ? (
				<LoaderIcon className="animate-spin" aria-hidden />
			) : (
				children
			)}
		</Button>
	);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const { useAppForm, withForm } = createFormHook({
	fieldComponents: {
		TextField,
		PasswordField,
		TextareaField,
		LexicalEditorField,
		CheckboxField,
		RadioGroupField,
		SelectField,
		NativeSelectField,
		ComboboxField,
		SwitchField,
		SliderField,
		OtpField,
	},
	formComponents: {
		SubmitButton,
	},
	fieldContext,
	formContext,
});

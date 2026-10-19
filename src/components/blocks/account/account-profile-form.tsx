"use client";

import { CameraIcon, Trash2Icon, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/hooks/use-form";
import { defaultLocale, Locale } from "@/i18n";
import type { CurrentUser } from "@/lib/auth/types";
import { getInitial } from "@/utils/str.util";
import { updateProfileAction } from "./actions";

interface AccountProfileFormProps {
	user: CurrentUser;
}

export function AccountProfileForm({ user }: AccountProfileFormProps) {
	const t = useTranslations("account.profile");
	const [avatarUrl, setAvatarUrl] = React.useState<string | null>(
		user.avatar_url
	);
	const [isUploading, setIsUploading] = React.useState(false);

	const form = useAppForm({
		defaultValues: {
			fullName: user.full_name ?? "",
			bio: user.bio ?? "",
			phone: user.phone ?? "",
			websiteUrl: user.website_url ?? "",
			locale: (user.locale as Locale) ?? defaultLocale,
		},
		onSubmit: async ({ value }) => {
			const res = await updateProfileAction({
				fullName: value.fullName,
				bio: value.bio,
				phone: value.phone,
				websiteUrl: value.websiteUrl,
				locale: value.locale as Locale,
				avatarUrl: avatarUrl,
			});

			if (res.success) {
				toast.success(t("saveSuccess"));
			} else {
				toast.error(res.error || t("saveError"));
			}
		},
	});

	async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > 2 * 1024 * 1024) {
			toast.error("Avatar image must be smaller than 2MB.");
			return;
		}

		try {
			setIsUploading(true);
			const reader = new FileReader();
			reader.onload = async () => {
				const base64Data = reader.result as string;
				setAvatarUrl(base64Data);
				const res = await updateProfileAction({ avatarUrl: base64Data });
				if (res.success) {
					toast.success(t("saveSuccess"));
				} else {
					toast.error(res.error || t("saveError"));
				}
				setIsUploading(false);
			};
			reader.readAsDataURL(file);
		} catch {
			toast.error(t("saveError"));
			setIsUploading(false);
		}
	}

	async function handleRemoveAvatar() {
		setAvatarUrl(null);
		const res = await updateProfileAction({ avatarUrl: null });
		if (res.success) {
			toast.success(t("saveSuccess"));
		} else {
			toast.error(res.error || t("saveError"));
		}
	}

	return (
		<Card className="border-border/60 shadow-sm backdrop-blur-sm">
			<CardHeader>
				<CardTitle className="text-xl font-semibold flex items-center gap-2">
					<UserIcon className="size-5 text-primary" />
					{t("title")}
				</CardTitle>
				<CardDescription>{t("subtitle")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Avatar section */}
				<div className="flex items-center gap-6 rounded-xl border border-border/40 bg-muted/30 p-4">
					<Avatar className="size-20 border border-border/80 shadow-xs">
						{avatarUrl ? (
							<AvatarImage src={avatarUrl} alt={user.full_name ?? ""} />
						) : null}
						<AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
							{getInitial(user.full_name)}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-wrap gap-3">
						<label htmlFor="avatar-file-input">
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="gap-2 cursor-pointer"
								asChild
								disabled={isUploading}
							>
								<span>
									<CameraIcon className="size-4" />
									{t("changeAvatar")}
								</span>
							</Button>
						</label>
						<input
							id="avatar-file-input"
							type="file"
							accept="image/*"
							className="sr-only"
							onChange={handleAvatarChange}
						/>
						{avatarUrl ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
								onClick={handleRemoveAvatar}
							>
								<Trash2Icon className="size-4" />
								{t("removeAvatar")}
							</Button>
						) : null}
					</div>
				</div>

				{/* Form inputs */}
				<form.AppForm>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<FieldGroup className="grid gap-4 sm:grid-cols-2">
							{/* Full Name */}
							<form.AppField
								name="fullName"
								validators={{
									onBlur: z
										.string()
										.min(2, "Name must be at least 2 characters."),
								}}
							>
								{(field) => (
									<field.TextField
										label={t("fullName")}
										placeholder={t("fullNamePlaceholder")}
									/>
								)}
							</form.AppField>

							{/* Preferred Language */}
							<form.AppField name="locale">
								{(field) => (
									<field.NativeSelectField
										label={t("language")}
										options={[
											{ value: "en", label: "English" },
											{ value: "fa", label: "فارسی / دری (Dari)" },
											{ value: "ps", label: "پښتو (Pashto)" },
										]}
									/>
								)}
							</form.AppField>

							{/* Phone Number */}
							<form.AppField name="phone">
								{(field) => (
									<field.TextField
										label={t("phone")}
										placeholder={t("phonePlaceholder")}
										type="tel"
									/>
								)}
							</form.AppField>

							{/* Website URL */}
							<form.AppField name="websiteUrl">
								{(field) => (
									<field.TextField
										label={t("websiteUrl")}
										placeholder={t("websiteUrlPlaceholder")}
										type="url"
									/>
								)}
							</form.AppField>
						</FieldGroup>

						{/* Bio */}
						<form.AppField name="bio">
							{(field) => (
								<field.TextareaField
									label={t("bio")}
									placeholder={t("bioPlaceholder")}
									className="min-h-24"
								/>
							)}
						</form.AppField>

						<div className="flex justify-end pt-2">
							<form.SubmitButton>
								{t("saveSuccess").replace(".", "")}
							</form.SubmitButton>
						</div>
					</form>
				</form.AppForm>
			</CardContent>
		</Card>
	);
}

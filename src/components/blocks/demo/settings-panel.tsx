"use client";

import {
	Building2,
	Mail,
	RotateCcw,
	Save,
	Settings2,
	ShieldCheck,
	Sparkles,
	UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	updateProfile,
	updateSchool,
	updateSiteSettings,
} from "@/lib/demo/actions";
import type { DemoSiteSettings } from "@/lib/demo/types";
import { useDemo } from "./demo-context";
import { DemoConfirm, DemoField, DemoHeading, DemoPanel } from "./demo-ui";

export function DemoSettings() {
	const t = useTranslations("demo");
	const { state, actor, run, reset } = useDemo();
	const school = state.schools.find((item) => item.id === actor.schoolId);
	const [name, setName] = React.useState(actor.name);
	const [email, setEmail] = React.useState(actor.email);
	const [schoolName, setSchoolName] = React.useState(school?.name ?? "");
	const [city, setCity] = React.useState(school?.city ?? "");
	const [schoolEmail, setSchoolEmail] = React.useState(school?.email ?? "");
	const [form, setForm] = React.useState<DemoSiteSettings>(state.settings);
	React.useEffect(() => {
		setName(actor.name);
		setEmail(actor.email);
		setSchoolName(school?.name ?? "");
		setCity(school?.city ?? "");
		setSchoolEmail(school?.email ?? "");
		setForm(state.settings);
	}, [actor.id]);
	function field(key: keyof DemoSiteSettings, value: string) {
		setForm((old) => ({ ...old, [key]: value }));
	}
	return (
		<div className="space-y-5">
			<DemoHeading
				eyebrow={t(`roles.${actor.role}`)}
				title={t("settings.heading")}
				description={t("settings.description")}
			/>
			<div className="grid items-start gap-5 lg:grid-cols-2">
				<DemoPanel className="p-5 sm:p-6">
					<div className="mb-5 flex items-center gap-2">
						<span className="demo-stat-icon demo-stat-icon--violet">
							<UserRound className="size-5" />
						</span>
						<div>
							<h2 className="font-extrabold text-[#19243b]">
								{t("settings.profile")}
							</h2>
							<p className="text-xs text-slate-500">
								{t("settings.profileHint")}
							</p>
						</div>
					</div>
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							run((s, id) => updateProfile(s, id, actor.id, name, email));
						}}
					>
						<DemoField label={t("people.name")} htmlFor="demo-profile-name">
							<Input
								id="demo-profile-name"
								className="demo-input"
								value={name}
								onChange={(event) => setName(event.target.value)}
								required
							/>
						</DemoField>
						<DemoField label={t("people.email")} htmlFor="demo-profile-email">
							<Input
								id="demo-profile-email"
								type="email"
								className="demo-input"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
							/>
						</DemoField>
						<Button type="submit" className="demo-rounded">
							<Save className="size-4" />
							{t("common.save")}
						</Button>
					</form>
				</DemoPanel>
				{actor.role === "school" && school && (
					<DemoPanel className="p-5 sm:p-6">
						<div className="mb-5 flex items-center gap-2">
							<span className="demo-stat-icon demo-stat-icon--mint">
								<Building2 className="size-5" />
							</span>
							<div>
								<h2 className="font-extrabold text-[#19243b]">
									{t("settings.schoolProfile")}
								</h2>
								<p className="text-xs text-slate-500">
									{t("settings.schoolHint")}
								</p>
							</div>
						</div>
						<form
							className="space-y-4"
							onSubmit={(event) => {
								event.preventDefault();
								run((s, id) =>
									updateSchool(s, id, school.id, {
										name: schoolName,
										city,
										email: schoolEmail,
									})
								);
							}}
						>
							<DemoField label={t("schools.name")} htmlFor="demo-own-school">
								<Input
									id="demo-own-school"
									className="demo-input"
									required
									value={schoolName}
									onChange={(event) => setSchoolName(event.target.value)}
								/>
							</DemoField>
							<DemoField label={t("schools.city")} htmlFor="demo-own-city">
								<Input
									id="demo-own-city"
									className="demo-input"
									required
									value={city}
									onChange={(event) => setCity(event.target.value)}
								/>
							</DemoField>
							<DemoField
								label={t("people.email")}
								htmlFor="demo-own-school-email"
							>
								<Input
									id="demo-own-school-email"
									type="email"
									className="demo-input"
									required
									value={schoolEmail}
									onChange={(event) => setSchoolEmail(event.target.value)}
								/>
							</DemoField>
							<Button type="submit" className="demo-rounded">
								{t("common.save")}
							</Button>
						</form>
					</DemoPanel>
				)}
				{actor.role !== "admin" && actor.role !== "school" && (
					<DemoPanel className="flex flex-col justify-center p-6">
						<Sparkles className="size-8 text-violet-600" />
						<h2 className="mt-4 font-extrabold text-[#19243b]">
							{t("settings.accountNote")}
						</h2>
						<p className="mt-2 text-sm leading-7 text-slate-500">
							{t("settings.accountHint")}
						</p>
					</DemoPanel>
				)}
			</div>
			{actor.role === "admin" && (
				<>
					<div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
						<DemoPanel className="p-5 sm:p-6">
							<div className="mb-5 flex items-center gap-2">
								<span className="demo-stat-icon demo-stat-icon--sky">
									<Settings2 className="size-5" />
								</span>
								<div>
									<h2 className="font-extrabold text-[#19243b]">
										{t("settings.siteInfo")}
									</h2>
									<p className="text-xs text-slate-500">
										{t("settings.siteHint")}
									</p>
								</div>
							</div>
							<form
								className="grid gap-4"
								onSubmit={(event) => {
									event.preventDefault();
									run((s, id) => updateSiteSettings(s, id, form));
								}}
							>
								<div className="grid gap-4 sm:grid-cols-2">
									<DemoField
										label={t("settings.siteName")}
										htmlFor="demo-site-name"
									>
										<Input
											id="demo-site-name"
											className="demo-input"
											required
											value={form.siteName}
											onChange={(event) =>
												field("siteName", event.target.value)
											}
										/>
									</DemoField>
									<DemoField
										label={t("settings.tagline")}
										htmlFor="demo-site-tagline"
									>
										<Input
											id="demo-site-tagline"
											className="demo-input"
											required
											value={form.tagline}
											onChange={(event) => field("tagline", event.target.value)}
										/>
									</DemoField>
								</div>
								<DemoField
									label={t("settings.heroTitle")}
									htmlFor="demo-site-hero"
								>
									<Input
										id="demo-site-hero"
										className="demo-input"
										required
										value={form.heroTitle}
										onChange={(event) => field("heroTitle", event.target.value)}
									/>
								</DemoField>
								<DemoField
									label={t("settings.heroDescription")}
									htmlFor="demo-site-description"
								>
									<Textarea
										id="demo-site-description"
										className="demo-input"
										required
										value={form.heroDescription}
										onChange={(event) =>
											field("heroDescription", event.target.value)
										}
									/>
								</DemoField>
								<div className="grid gap-4 sm:grid-cols-2">
									<DemoField
										label={t("settings.contactEmail")}
										htmlFor="demo-site-email"
									>
										<Input
											id="demo-site-email"
											type="email"
											className="demo-input"
											required
											value={form.contactEmail}
											onChange={(event) =>
												field("contactEmail", event.target.value)
											}
										/>
									</DemoField>
									<DemoField
										label={t("settings.announcement")}
										htmlFor="demo-site-announcement"
									>
										<Input
											id="demo-site-announcement"
											className="demo-input"
											value={form.announcement}
											onChange={(event) =>
												field("announcement", event.target.value)
											}
										/>
									</DemoField>
								</div>
								<Button
									type="submit"
									className="demo-rounded justify-self-start"
								>
									<Save className="size-4" />
									{t("settings.saveSite")}
								</Button>
							</form>
						</DemoPanel>
						<DemoPanel className="overflow-hidden p-0">
							<div className="border-b border-slate-100 px-5 py-4">
								<h2 className="text-sm font-extrabold text-[#19243b]">
									{t("settings.preview")}
								</h2>
								<p className="mt-1 text-xs text-slate-400">
									{t("settings.previewHint")}
								</p>
							</div>
							<div className="m-4 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_90%_10%,#4d3d7d_0%,transparent_55%),linear-gradient(135deg,#17233a,#252640)] px-6 py-8 text-white">
								<span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-[#b7f486]">
									{form.announcement || form.tagline}
								</span>
								<h3 className="mt-5 text-xl font-extrabold leading-[1.6]">
									{form.heroTitle}
								</h3>
								<p className="mt-3 text-xs leading-7 text-white/65">
									{form.heroDescription}
								</p>
								<span className="mt-5 inline-flex rounded-xl bg-[#b7f486] px-4 py-2 text-xs font-bold text-[#17233a]">
									{form.siteName}
								</span>
							</div>
							<div className="flex items-center gap-2 px-5 pb-5 text-xs text-slate-400">
								<Mail className="size-4" />
								{form.contactEmail}
							</div>
						</DemoPanel>
					</div>
					<DemoPanel className="flex flex-col gap-3 border-rose-100 bg-rose-50/40 p-5 sm:flex-row sm:items-center">
						<div className="flex-1">
							<h2 className="text-sm font-extrabold text-rose-900">
								{t("settings.resetTitle")}
							</h2>
							<p className="mt-1 text-xs leading-6 text-rose-700">
								{t("settings.resetHint")}
							</p>
						</div>
						<DemoConfirm
							destructive
							title={t("settings.resetTitle")}
							description={t("settings.resetConfirm")}
							onConfirm={reset}
						>
							<Button
								type="button"
								variant="destructive"
								className="demo-rounded"
							>
								<RotateCcw className="size-4" />
								{t("settings.reset")}
							</Button>
						</DemoConfirm>
					</DemoPanel>
				</>
			)}
		</div>
	);
}

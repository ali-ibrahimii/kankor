"use client";

import { CheckCircle2, Lock, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	type AppliedDiscount,
	DiscountCodeField,
} from "@/components/blocks/discounts";
import { Spinner } from "@/components/ui/spinner";
import { Link, useRouter } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/env/client-env";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth.provider";
import type { QuizDetail } from "@/types/queries.types";

export interface QuizDetailActionsProps {
	quiz: QuizDetail;
}

export function QuizDetailActions({ quiz }: QuizDetailActionsProps) {
	const t = useTranslations("quizzes");
	const router = useRouter();
	const { isAuthenticated, refetchProfile } = useAuth();
	const [isRegistering, setIsRegistering] = React.useState(false);
	const [discount, setDiscount] = React.useState<AppliedDiscount | null>(null);

	if (!isAuthenticated) {
		return (
			<Link href={routes.auth.signup.page()} className="button-primary w-full">
				<LogIn className="size-4" />
				<span>{t("signUpToTake")}</span>
			</Link>
		);
	}

	if (quiz.is_registered) {
		return (
			<div className="flex items-center gap-2.5 rounded-2xl border border-[#e8eeea] bg-[#faf6ee] px-4 py-3.5 text-sm font-bold text-[#02656b] dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200">
				<CheckCircle2 className="size-4 shrink-0" />
				<span>{t("alreadyRegistered")}</span>
			</div>
		);
	}

	if (!quiz.registration_open) {
		return (
			<div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-400">
				<Lock className="size-4 shrink-0" />
				<span>{t("registrationClosed")}</span>
			</div>
		);
	}

	async function handleRegister() {
		if (!isSupabaseConfigured) {
			toast.error(t("registrationFailed"));
			return;
		}
		setIsRegistering(true);
		try {
			const client = createClient();
			const { error } = await client.rpc("purchase_item", {
				p_item_type: "quiz",
				p_item_id: quiz.id,
				p_discount_code: discount?.code,
			});
			if (error) throw error;
			toast.success(t("registrationSuccess"));
			if (!quiz.is_free) await refetchProfile();
			router.refresh();
		} catch (error) {
			const message = (error as { message?: string })?.message?.includes(
				"insufficient_credits"
			)
				? t("insufficientCredits")
				: t("registrationFailed");
			toast.error(message);
		} finally {
			setIsRegistering(false);
		}
	}

	return (
		<div className="space-y-3">
			{!quiz.is_free && (
				<DiscountCodeField
					itemType="quiz"
					itemId={quiz.id}
					onApplied={setDiscount}
				/>
			)}
			<button
				type="button"
				className="button-primary w-full disabled:pointer-events-none disabled:opacity-60"
				onClick={handleRegister}
				disabled={isRegistering}
			>
				{isRegistering && <Spinner className="size-4" />}
				<span>
					{quiz.is_free
						? t("register")
						: t("registerForCredits", { count: quiz.price_credits ?? 0 })}
				</span>
			</button>
		</div>
	);
}

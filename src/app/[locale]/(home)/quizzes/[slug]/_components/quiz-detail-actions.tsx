"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	type AppliedDiscount,
	DiscountCodeField,
} from "@/components/blocks/discounts";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Link, useRouter } from "@/i18n/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth.provider";
import { QuizDetail } from "@/types/queries.types";

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
			<Button
				asChild
				size="lg"
				className="w-full gap-2 shadow-sm font-semibold"
			>
				<Link href={routes.auth.signup.page()}>
					<LogIn className="size-4" />
					{t("signUpToTake")}
				</Link>
			</Button>
		);
	}

	if (quiz.is_registered) {
		return (
			<p className="text-sm font-medium text-emerald-600">
				{t("alreadyRegistered")}
			</p>
		);
	}

	if (!quiz.registration_open) {
		return (
			<p className="text-sm text-muted-foreground">{t("registrationClosed")}</p>
		);
	}

	async function handleRegister() {
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
		<div className="space-y-2">
			{!quiz.is_free && (
				<DiscountCodeField
					itemType="quiz"
					itemId={quiz.id}
					onApplied={setDiscount}
				/>
			)}
			<Button
				size="lg"
				className="w-full gap-2 shadow-sm font-semibold"
				onClick={handleRegister}
				disabled={isRegistering}
			>
				{isRegistering && <Spinner className="size-4" />}
				{quiz.is_free
					? t("register")
					: t("registerForCredits", { count: quiz.price_credits ?? 0 })}
			</Button>
		</div>
	);
}

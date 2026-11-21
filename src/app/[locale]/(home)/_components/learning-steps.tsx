import { BookOpen, GraduationCap, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

/** Presentational learning journey; no enrollment or catalog logic. */
export async function LearningSteps() {
	const t = await getTranslations("landing.design");
	const steps = [
		{ key: "discover", icon: Search },
		{ key: "learn", icon: BookOpen },
		{ key: "grow", icon: GraduationCap },
	] as const;

	return (
		<section className="learning-steps" aria-labelledby="learning-steps-title">
			<div className="page-container">
				<div className="mx-auto mb-10 max-w-2xl text-center">
					<p className="text-sm font-bold text-primary">{t("stepsEyebrow")}</p>
					<h2 id="learning-steps-title" className="section-title">
						{t("stepsTitle")}
					</h2>
					<p className="mt-3 text-sm leading-7 text-muted-foreground">
						{t("stepsDescription")}
					</p>
				</div>
				<ol className="grid gap-6 md:grid-cols-3">
					{steps.map(({ key, icon: Icon }, index) => (
						<li key={key} className="learning-step">
							<span className="learning-step-number" aria-hidden="true">
								{t(`step${index + 1}`)}
							</span>
							<span className="learning-step-icon">
								<Icon className="size-7" aria-hidden="true" />
							</span>
							<h3 className="mt-6 text-lg font-extrabold">
								{t(`${key}Title`)}
							</h3>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								{t(`${key}Description`)}
							</p>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
